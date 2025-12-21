import { getUrl } from "../shared";
import { LcAxios } from "../utils/httpUtils";

const graphqlStr = `
    query userProfilePublicProfile($userSlug: String!) {
        userProfilePublicProfile(userSlug: $userSlug) {
            profile {
                userSlug
                realName
            }
        }
    }
`;

export interface UserProfile {
    userSlug: string;
    realName: string;
}

export const queryUserProfile = async (userSlug: string): Promise<UserProfile | null> => {
    try {
        const res = await LcAxios(getUrl("userGraphql"), {
            method: "POST",
            data: {
                query: graphqlStr,
                variables: { userSlug },
                operationName: "userProfilePublicProfile",
            },
        });
        return res.data.data.userProfilePublicProfile?.profile || null;
    } catch {
        return null;
    }
};
