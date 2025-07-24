
'use client';

import * as React from 'react';
import { ProfilePage } from './profile-page';
import { EditProfileView } from './edit-profile-view';
import { PrivacyView } from './privacy-view';
import { LegalView } from './legal-view';

type ProfileView = 'main' | 'editProfile' | 'privacy' | 'legal';

export function ProfileViewManager() {
    const [currentView, setCurrentView] = React.useState<ProfileView>('main');

    const handleNavigate = (view: ProfileView) => {
        setCurrentView(view);
    }
    
    const handleBack = () => {
        setCurrentView('main');
    }

    switch (currentView) {
        case 'editProfile':
            return <EditProfileView onBack={handleBack} />;
        case 'privacy':
            return <PrivacyView onBack={handleBack} />;
        case 'legal':
            return <LegalView onBack={handleBack} />;
        case 'main':
        default:
            return <ProfilePage onNavigate={handleNavigate} />;
    }
}
