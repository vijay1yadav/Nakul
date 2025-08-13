import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import logo from '../assets/kracht-logo.png';

import {
    FluentProvider,
    webLightTheme,
    makeStyles,
    shorthands,
    tokens,
    Image,
    Title3,
    Subtitle2,
    Body1,
    Caption1,
    Button,
    Card,
    Divider,
} from '@fluentui/react-components';

// Icons for the features list
import {
    ChartMultipleRegular,
    ShieldRegular,
    LightbulbRegular,
    TargetArrowRegular,
} from '@fluentui/react-icons';


// Styles for a more professional, split-screen layout
const useStyles = makeStyles({
    root: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: tokens.colorNeutralBackground3,
    },
    card: {
        width: '850px', // Increased width to accommodate more content
        height: '550px',
        display: 'flex',
        flexDirection: 'row',
        ...shorthands.padding('0px'),
    },
    // Left side of the card for branding and logo
    brandingPane: {
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#001e3c', // A deep blue, similar to Azure's dark theme
        ...shorthands.padding('40px'),
        ...shorthands.gap('20px'),
    },
    // Right side of the card for the login form
    formPane: {
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        ...shorthands.padding('40px'),
        ...shorthands.gap('24px'),
    },
    logoImage: {
        height: '80px',
        width: 'auto',
    },
    featuresList: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
        marginTop: '20px',
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap('12px'),
        color: tokens.colorNeutralForegroundOnBrand,
    },
    featureIcon: {
        fontSize: '24px',
    },
    footerText: {
        textAlign: 'center',
        color: tokens.colorNeutralForeground3,
    },
});

const Login = () => {
    const styles = useStyles();
    const { instance } = useMsal();

    const handleLogin = async () => {
        try {
            await instance.loginPopup(loginRequest);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    return (
        <FluentProvider theme={webLightTheme}>
            <div className={styles.root}>
                <Card className={styles.card}>
                    {/* Branding Section */}
                    <div className={styles.brandingPane}>
                        <Image src={logo} alt="Kracht Logo" className={styles.logoImage} />
                        <Title3 align="center" style={{ color: tokens.colorNeutralForegroundOnBrand }}>
                            Kracht Security Cost Analyzer
                        </Title3>

                        <Divider style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

                        {/* Feature list */}
                        <div className={styles.featuresList}>
                            <div className={styles.featureItem}>
                                <ChartMultipleRegular className={styles.featureIcon} />
                                <Body1>Visualize your security costs.</Body1>
                            </div>
                            <div className={styles.featureItem}>
                                <TargetArrowRegular className={styles.featureIcon} />
                                <Body1>Identify cost-saving opportunities.</Body1>
                            </div>
                            <div className={styles.featureItem}>
                                <LightbulbRegular className={styles.featureIcon} />
                                <Body1>Control expenses with detailed insights.</Body1>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className={styles.formPane}>
                        <Title3>Sign in</Title3>
                        <Body1 style={{ color: tokens.colorNeutralForeground2 }}>
                            Sign in to manage your security spending.
                        </Body1>
                        <Button
                            appearance="primary"
                            size="large"
                            onClick={handleLogin}
                            style={{ width: '100%' }}
                        >
                            Sign In with Microsoft
                        </Button>
                        <Divider />
                        <Caption1 className={styles.footerText}>
                            Powered by Microsoft Azure
                        </Caption1>
                    </div>
                </Card>
            </div>
        </FluentProvider>
    );
};

export default Login;
