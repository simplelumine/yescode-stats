import { ProfileResponse } from '../types';
import * as os from 'os';

/**
 * Extract team information from profile if user is an active team member
 */
export function getTeamInfo(profile: ProfileResponse): { teamApiKey: string; teamName: string } | null {
    // Check if user has an active team membership
    if (profile.team_membership && profile.current_team) {
        return {
            teamApiKey: profile.team_membership.team_api_key,
            teamName: profile.team_membership.team_name
        };
    }
    return null;
}

/**
 * Detect the operating system
 */
export function getOperatingSystem(): 'windows' | 'unix' {
    const platform = os.platform();
    return platform === 'win32' ? 'windows' : 'unix';
}
