import React from 'react';
import logo from '../assets/kracht-logo.png';
import { useMsal } from '@azure/msal-react';

// Fluent UI Imports
import {
    FluentProvider,
    Button,
    Title3,
    makeStyles,
    shorthands,
    tokens,
    webLightTheme,
    webDarkTheme,
    Image,
    Text,
    Menu,
    MenuTrigger,
    MenuList,
    MenuItem,
    MenuPopover,
    Persona,
} from '@fluentui/react-components';
import { useBoolean } from '@fluentui/react-hooks';

// Fluent UI Icon Imports
import {
    bundleIcon,
    HomeFilled,
    HomeRegular,
    ShieldFilled,
    ShieldRegular,
    ChartMultipleFilled,
    ChartMultipleRegular,
    DataTrendingFilled,
    DataTrendingRegular,
    NavigationFilled,
    NavigationRegular,
    ServerFilled,
    ServerRegular,
    NetworkCheckFilled,
    NetworkCheckRegular,
    KeyFilled,
    KeyRegular,
    LightbulbFilled,
    LightbulbRegular,
    WeatherSunnyFilled,
    WeatherMoonFilled,
    PanelLeftExpandFilled,
    PanelLeftExpandRegular,
    SignOutRegular,
} from '@fluentui/react-icons';

// Data and Component Imports
import useDashboardData from './useDashboardData';
import ErrorBoundary from './ErrorBoundary';
import OverviewSection from './OverviewSection';
import DefenderPlanSection from './DefenderPlanSection';
import DefenderCostSection from './DefenderCostSection';
import ResourceGroupCostSection from './ResourceGroupCostSection';
import TopResourcesCostSection from './TopResourcesCostSection';
import SubscriptionsCostSection from './SubscriptionsCostSection';
import NetworkFirewallCostSection from './NetworkFirewallCostSection';
import WafCostSection from './WafCostSection';
import MicrosoftSentinelCostSection from './MicrosoftSentinelCostSection';
import KeyVaultCostSection from './KeyVaultCostSection';
import DDoSProtectionCostSection from './DDoSProtectionCostSection';
import RecommendationsSection from './RecommendationsSection';


// Bundle icons for easy switching between filled/regular states
const HomeIcon = bundleIcon(HomeFilled, HomeRegular);
const ShieldIcon = bundleIcon(ShieldFilled, ShieldRegular);
const ChartIcon = bundleIcon(ChartMultipleFilled, ChartMultipleRegular);
const TrendingIcon = bundleIcon(DataTrendingFilled, DataTrendingRegular);
const ServerIcon = bundleIcon(ServerFilled, ServerRegular);
const NetworkIcon = bundleIcon(NetworkCheckFilled, NetworkCheckRegular);
const KeyVaultIcon = bundleIcon(KeyFilled, KeyRegular);
const RecommendationsIcon = bundleIcon(LightbulbFilled, LightbulbRegular);
const NavIcon = bundleIcon(NavigationFilled, NavigationRegular);
const PanelLeftExpandIcon = bundleIcon(PanelLeftExpandFilled, PanelLeftExpandRegular);


const useStyles = makeStyles({
    container: {
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: tokens.colorNeutralBackground1,
    },
    sidebar: {
        width: '280px',
        backgroundColor: tokens.colorNeutralBackground2,
        ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke2),
        transitionProperty: 'width',
        transitionDuration: tokens.durationNormal,
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.padding(tokens.spacingVerticalS),
        flexShrink: 0,
    },
    sidebarCollapsed: {
        width: '48px',
    },
    sidebarHeader: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap(tokens.spacingHorizontalS),
        ...shorthands.padding(tokens.spacingHorizontalM),
        marginBottom: tokens.spacingVerticalM,
    },
    logo: {
        height: '32px',
    },
    navButton: {
        width: '100%',
        justifyContent: 'flex-start',
        ...shorthands.padding(tokens.spacingHorizontalM, tokens.spacingVerticalM),
        ...shorthands.border('0'),
        '> span': {
            ...shorthands.margin('0', tokens.spacingHorizontalS),
        },
    },
    mainContent: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.overflow('hidden'),
        flexGrow: 1,
    },
    header: {
        backgroundColor: tokens.colorNeutralBackground1,
        ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
        ...shorthands.padding(tokens.spacingHorizontalL),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '56px',
        flexShrink: 0,
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap(tokens.spacingHorizontalS),
    },
    content: {
        flexGrow: 1,
        ...shorthands.padding(tokens.spacingHorizontalL),
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: tokens.colorNeutralBackground3,
    },
});

const Dashboard = () => {
    const styles = useStyles();
    const { instance } = useMsal();
    const [isSidebarOpen, { toggle: toggleSidebar }] = useBoolean(true);
    const [isDarkMode, { toggle: toggleDarkMode }] = useBoolean(false);

    // --- FIX IS HERE ---
    // Destructure the 'loading' state from the hook
    const dashboardData = useDashboardData();
    const { selectedSection, setSelectedSection, loading } = dashboardData;

    const handleLogout = () => {
        instance.logoutPopup({
            postLogoutRedirectUri: "/",
            mainWindowRedirectUri: "/"
        });
    };

    const sidebarItems = [
        { name: 'Overview', icon: <HomeIcon />, section: 'overview' },
        { name: 'Defender Plan', icon: <ShieldIcon />, section: 'defenderPlan' },
        { name: 'Defender Cost', icon: <ShieldIcon />, section: 'defenderCost' },
        { name: 'Resource Group Cost', icon: <ChartIcon />, section: 'resourceGroupCost' },
        { name: 'Top Resources Cost', icon: <TrendingIcon />, section: 'topResourcesCost' },
        { name: 'Subscriptions Cost', icon: <NavIcon />, section: 'subscriptionsCost' },
        { name: 'Network Firewall Cost', icon: <ServerIcon />, section: 'networkFirewallCost' },
        { name: 'WAF Cost', icon: <NetworkIcon />, section: 'wafCost' },
        { name: 'Microsoft Sentinel Cost', icon: <ShieldIcon />, section: 'microsoftSentinelCost' },
        { name: 'Key Vault Cost', icon: <KeyVaultIcon />, section: 'keyVaultCost' },
        { name: 'DDoS Protection Cost', icon: <ShieldIcon />, section: 'ddosProtectionCost' },
        { name: 'Recommendations', icon: <RecommendationsIcon />, section: 'recommendations' },
    ];

    const currentSectionName = sidebarItems.find(item => item.section === selectedSection)?.name || 'Overview';

    return (
        <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
            <div className={styles.container}>
                <div className={`${styles.sidebar} ${!isSidebarOpen && styles.sidebarCollapsed}`}>
                    <div className={styles.sidebarHeader}>
                        <Image src={logo} alt="Kracht Logo" className={styles.logo} />
                        {isSidebarOpen && <Text weight="semibold">Kracht</Text>}
                    </div>
                    <Button
                        appearance="subtle"
                        icon={<PanelLeftExpandIcon />}
                        onClick={toggleSidebar}
                        aria-label={isSidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
                        style={{ marginBottom: tokens.spacingVerticalM }}
                    />
                    {sidebarItems.map(item => (
                        <Button
                            key={item.section}
                            appearance={selectedSection === item.section ? 'primary' : 'transparent'}
                            className={styles.navButton}
                            icon={item.icon}
                            onClick={() => setSelectedSection(item.section)}
                        >
                            {isSidebarOpen && item.name}
                        </Button>
                    ))}
                </div>

                <div className={styles.mainContent}>
                    <header className={styles.header}>
                        <Title3>{currentSectionName}</Title3>
                        <div className={styles.headerActions}>
                            <Button
                                icon={isDarkMode ? <WeatherSunnyFilled /> : <WeatherMoonFilled />}
                                onClick={toggleDarkMode}
                                appearance="transparent"
                                aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            />
                            <Menu>
                                <MenuTrigger disableButtonEnhancement>
                                    <Persona
                                        name={instance.getActiveAccount()?.name}
                                        secondaryText={instance.getActiveAccount()?.username}
                                        size="small"
                                    />
                                </MenuTrigger>
                                <MenuPopover>
                                    <MenuList>
                                        <MenuItem icon={<SignOutRegular />} onClick={handleLogout}>
                                            Sign out
                                        </MenuItem>
                                    </MenuList>
                                </MenuPopover>
                            </Menu>
                        </div>
                    </header>

                    <main className={styles.content}>
                        {selectedSection === 'overview' && (
                            <ErrorBoundary>
                                {/* Pass the 'loading' prop down to the child component */}
                                <OverviewSection {...dashboardData} loading={loading} />
                            </ErrorBoundary>
                        )}
                        {selectedSection === 'defenderPlan' && dashboardData.defenderPlanData && (
                            <ErrorBoundary>
                                <DefenderPlanSection defenderPlanData={dashboardData.defenderPlanData} />
                            </ErrorBoundary>
                        )}
                        {selectedSection === 'defenderCost' && (
                            <ErrorBoundary>
                                <DefenderCostSection
                                    defenderCostData={dashboardData.defenderCostData}
                                    granularity={dashboardData.granularity}
                                    setGranularity={dashboardData.setGranularity}
                                />
                            </ErrorBoundary>
                        )}
                        {selectedSection === 'resourceGroupCost' && (
                            <ErrorBoundary>
                                <ResourceGroupCostSection
                                    resourceGroups={dashboardData.resourceGroups}
                                    resourceGroupChartData={dashboardData.resourceGroupChartData}
                                    resourceGroupColumns={dashboardData.resourceGroupColumns}
                                />
                            </ErrorBoundary>
                        )}
                        {selectedSection === 'topResourcesCost' && (
                            <ErrorBoundary>
                                <TopResourcesCostSection
                                    topResources={dashboardData.topResources}
                                    topResourceLimit={dashboardData.topResourceLimit}
                                    setTopResourceLimit={dashboardData.setTopResourceLimit}
                                    topResourcesChartData={dashboardData.topResourcesChartData}
                                    topResourcesColumns={dashboardData.topResourcesColumns}
                                />
                            </ErrorBoundary>
                        )}
                        {selectedSection === 'subscriptionsCost' && (
                            <ErrorBoundary>
                                <SubscriptionsCostSection
                                    subscriptions={dashboardData.subscriptions}
                                    selectedSubscription={dashboardData.selectedSubscription}
                                    setSelectedSubscription={dashboardData.setSelectedSubscription}
                                    subscriptionColumns={dashboardData.subscriptionColumns}
                                />
                            </ErrorBoundary>
                        )}
                        {selectedSection === 'networkFirewallCost' && (
                            <ErrorBoundary>
                                <NetworkFirewallCostSection firewallCostData={dashboardData.firewallCostData} />
                            </ErrorBoundary>
                        )}
                        {selectedSection === 'wafCost' && (
                            <ErrorBoundary>
                                <WafCostSection wafCostData={dashboardData.wafCostData} />
                            </ErrorBoundary>
                        )}
                        {selectedSection === 'microsoftSentinelCost' && (
                            <ErrorBoundary>
                                <MicrosoftSentinelCostSection sentinelCostData={dashboardData.sentinelCostData} />
                            </ErrorBoundary>
                        )}
                        {selectedSection === 'keyVaultCost' && (
                            <ErrorBoundary>
                                <KeyVaultCostSection
                                    keyVaultCostData={dashboardData.keyVaultCostData}
                                    granularity={dashboardData.granularity}
                                    setGranularity={dashboardData.setGranularity}
                                />
                            </ErrorBoundary>
                        )}
                        {selectedSection === 'ddosProtectionCost' && (
                            <ErrorBoundary>
                                <DDoSProtectionCostSection
                                    ddosProtectionCostData={dashboardData.ddosProtectionCostData}
                                    granularity={dashboardData.granularity}
                                    setGranularity={dashboardData.setGranularity}
                                />
                            </ErrorBoundary>
                        )}
                        {selectedSection === 'recommendations' && (
                            <ErrorBoundary>
                                <RecommendationsSection />
                            </ErrorBoundary>
                        )}
                    </main>
                </div>
            </div>
        </FluentProvider>
    );
};

export default Dashboard;
