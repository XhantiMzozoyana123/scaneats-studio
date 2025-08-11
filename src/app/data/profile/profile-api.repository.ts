
import type { IProfileRepository } from '@/app/domain/profile.repository';
import type { Profile } from '@/app/domain/profile';
import { API_BASE_URL } from '@/app/shared/lib/api';
import { jwtDecode } from 'jwt-decode';

interface AppJwtPayload {
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string | string[];
    // other claims like sub, email, jti etc.
}


const initialProfileState: Profile = {
  id: null,
  name: '',
  gender: 'Prefer not to say',
  weight: '',
  goals: '',
  birthDate: null,
  isSubscribed: false,
  credits: 0,
};

export class ProfileApiRepository implements IProfileRepository {
  async getProfile(token: string): Promise<{ profile: Profile | null; isSubscribed: boolean }> {
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch profile, credit balance, and subscription status in parallel
    const [profileRes, creditRes, subscriptionRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/profile`, { headers }),
      fetch(`${API_BASE_URL}/api/credit/balance`, { headers }),
      fetch(`${API_BASE_URL}/api/event/subscription/status`, { headers }),
    ]);

    if (profileRes.status === 401 || creditRes.status === 401 || subscriptionRes.status === 401) {
        throw new Error('Session Expired');
    }

    let userProfile = initialProfileState;
    let credits = 0;
    let isSubscribed = false;

    // Process profile response
    if (profileRes.ok) {
        const profiles = await profileRes.json();
        if (profiles && profiles.length > 0) {
            const p = profiles[0];
            userProfile = {
                ...p,
                birthDate: p.BirthDate ? new Date(p.BirthDate) : null,
                weight: p.Weight || '',
            };
        }
    } else if (profileRes.status !== 404) {
         console.error('Failed to fetch profile', profileRes.statusText);
    }
    
    // Process credits response
    if (creditRes.ok) {
        const creditData = await creditRes.json();
        credits = creditData.credits || 0;
    } else {
        console.error('Failed to fetch credit balance', creditRes.statusText);
    }

    // Process subscription status response
    if (subscriptionRes.ok) {
        const subData = await subscriptionRes.json();
        isSubscribed = subData.isSubscribed || false;
    } else {
        console.error('Failed to fetch subscription status', subscriptionRes.statusText);
    }
    

    // Merge all data into the final profile object
    const finalProfile = { ...userProfile, isSubscribed, credits };
    
    // Also return isSubscribed separately for direct use in context
    return { profile: finalProfile, isSubscribed };
  }

  async saveProfile(token: string, profileData: Profile): Promise<Profile> {
    const isNewProfile = !profileData.id;
    const endpoint = isNewProfile ? `${API_BASE_URL}/api/profile` : `${API_BASE_URL}/api/profile/${profileData.id}`;
    const method = isNewProfile ? 'POST' : 'PUT';

    const calculateAge = (birthDate: Date | null): number => {
      if (!birthDate) return 0;
      const today = new Date();
      let age = today.getFullYear() - new Date(birthDate).getFullYear();
      const m = today.getMonth() - new Date(birthDate).getMonth();
      if (m < 0 || (m === 0 && today.getDate() < new Date(birthDate).getDate())) {
        age--;
      }
      return age;
    };
    
    const payload: any = {
      Name: profileData.name,
      Gender: profileData.gender,
      Weight: String(profileData.weight || '0'),
      Goals: profileData.goals,
      BirthDate: profileData.birthDate ? new Date(profileData.birthDate).toISOString() : null,
      Age: calculateAge(profileData.birthDate),
    };

    if (!isNewProfile) {
      payload.Id = profileData.id;
    } else {
      // Ensure Id is not sent on creation
      delete payload.Id;
    }

    const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    
    if (response.status === 403) {
        throw new Error('Subscription Required');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save profile.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    if (method === 'POST') {
        const newProfileData = await response.json();
        return { 
            ...profileData, // Keep the frontend state consistent
            id: newProfileData.id, // Update with the new ID from the backend
            isSubscribed: profileData.isSubscribed, 
            birthDate: newProfileData.BirthDate ? new Date(newProfileData.BirthDate) : null 
        };
    } else { 
        return { ...profileData, isSubscribed: profileData.isSubscribed };
    }
  }
}
