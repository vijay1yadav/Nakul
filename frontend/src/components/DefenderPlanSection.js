import React, { useState, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Fluent UI Imports
import {
    makeStyles,
    shorthands,
    tokens,
    Card,
    CardHeader,
    Title3,
    Body1,
    Button,
    Dropdown,
    Option,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    TableCellLayout,
    Spinner,
    Badge,
} from '@fluentui/react-components';

// Fluent UI Icon Imports
import {
    ShieldFilled,
    CalendarLtrFilled,
    DocumentArrowDownFilled,
} from '@fluentui/react-icons';

// Register Chart.js components
Chart.register(...registerables);

const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('24px'),
    },
    // Grid layout for chart and table
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 2fr', // Chart 1/3, table 2/3
        ...shorthands.gap('24px'),
        alignItems: 'flex-start',
    },
    chartContainer: {
        position: 'sticky',
        top: '20px',
    },
    controls: {
        display: 'flex',
        flexWrap: 'wrap',
        ...shorthands.gap('16px'),
        alignItems: 'center',
        paddingBottom: tokens.spacingVerticalL,
    },
    tableContainer: {
        maxHeight: '600px',
        overflow: 'auto',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        ...shorthands.gap(tokens.spacingHorizontalS),
        color: tokens.colorNeutralForeground2,
        paddingTop: tokens.spacingVerticalL,
    },
});

// Badge by tier helper
const getTierBadge = (tier) => {
    if (tier === 'N/A' || (typeof tier === 'string' && tier.includes('Deprecated'))) {
        return <Badge color="informative">{tier}</Badge>;
    }
    if (tier === 'Off') {
        return <Badge color="danger">{tier}</Badge>;
    }
    if (typeof tier === 'string' && (tier.includes('Standard') || tier.includes('Plan'))) {
        return <Badge color="success">{tier}</Badge>;
    }
    return <Badge color="neutral">{tier}</Badge>;
};

const DefenderPlanSection = ({ defenderPlanData = {} }) => {
    const styles = useStyles();
    const { tierMatrix = [], plans = [], lastUpdated } = defenderPlanData;

    const [serviceFilter, setServiceFilter] = useState('all');
    const [subscriptionFilter, setSubscriptionFilter] = useState('all');

    const subscriptions = useMemo(
        () => [...new Set(tierMatrix.map((row) => row.subscriptionName))].sort(),
        [tierMatrix]
    );

    // Summary chart data
    const chartData = useMemo(() => {
        let enabled = 0;
        let disabled = 0;
        let deprecated = 0;

        tierMatrix.forEach((row) => {
            plans.forEach((plan) => {
                const tier = row[plan] || 'N/A';
                if (typeof tier === 'string' && (tier.includes('Standard') || tier.includes('Plan'))) {
                    enabled++;
                } else if (tier === 'Off') {
                    disabled++;
                } else if (typeof tier === 'string' && tier.includes('Deprecated')) {
                    deprecated++;
                }
            });
        });

        return {
            labels: ['Enabled', 'Disabled', 'Deprecated'],
            datasets: [
                {
                    label: 'Plan Status',
                    data: [enabled, disabled, deprecated],
                    backgroundColor: ['#107C10', '#D13438', '#605E5C'],
                    borderColor: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
                    borderWidth: 2,
                },
            ],
        };
    }, [tierMatrix, plans]);

    // Filtered plans list
    const filteredPlans = useMemo(() => {
        return plans.filter((plan) => {
            if (serviceFilter === 'all') return true;

            const tiers = subscriptions.map((subscription) => {
                const row = tierMatrix.find((r) => r.subscriptionName === subscription);
                return row ? row[plan] || 'N/A' : 'N/A';
            });

            const enabledCount = tiers.filter(
                (tier) => typeof tier === 'string' && (tier.includes('Standard') || tier.includes('Plan'))
            ).length;
            const disabledCount = tiers.filter((tier) => tier === 'Off').length;
            const deprecatedCount = tiers.filter(
                (tier) => typeof tier === 'string' && tier.includes('Deprecated')
            ).length;

            if (serviceFilter === 'enabledSome') return enabledCount > 0 && enabledCount < subscriptions.length;
            if (serviceFilter === 'disabledSome') return disabledCount > 0;
            if (serviceFilter === 'deprecated') return deprecatedCount > 0;
            return true;
        });
    }, [plans, serviceFilter, subscriptions, tierMatrix]);

    const activeSubscriptions =
        subscriptionFilter === 'all' ? subscriptions : [subscriptionFilter];

    // Robust loading guard (prevents blank screen if data is missing)
    if (!Array.isArray(tierMatrix) || !Array.isArray(plans) || !tierMatrix.length || !plans.length) {
        return <Spinner label="Loading Defender plan data..." />;
    }

    return (
        <div className={styles.root}>
            <div className={styles.mainGrid}>
                <div className={styles.chartContainer}>
                    <Card>
                        <CardHeader header={<Title3>Overall Plan Status</Title3>} />
                        <Doughnut data={chartData} />
                    </Card>
                </div>

                <Card>
                    <CardHeader
                        header={<Title3>Microsoft Defender for Cloud Service Plan</Title3>}
                        action={
                            <Button
                                icon={<DocumentArrowDownFilled />}
                                onClick={() => console.log('Exporting CSV...')}
                            >
                                Export CSV
                            </Button>
                        }
                    />
                    <div className={styles.controls}>
                        <Dropdown
                            value={serviceFilter}
                            onOptionSelect={(_, data) => setServiceFilter(data.optionValue)}
                        >
                            <Option value="all">Filter Services: All</Option>
                            <Option value="enabledSome">Enabled in Some Subscriptions</Option>
                            <Option value="disabledSome">Disabled in Some Subscriptions</Option>
                            <Option value="deprecated">Deprecated Services</Option>
                        </Dropdown>

                        <Dropdown
                            value={subscriptionFilter}
                            onOptionSelect={(_, data) => setSubscriptionFilter(data.optionValue)}
                        >
                            <Option value="all">Filter by Subscription: All</Option>
                            {subscriptions.map((subscription, index) => (
                                <Option key={index} value={subscription}>
                                    {subscription}
                                </Option>
                            ))}
                        </Dropdown>
                    </div>

                    <div className={styles.tableContainer}>
                        <Table aria-label="Defender Plan Details Table">
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>Service Name</TableHeaderCell>
                                    {activeSubscriptions.map((subscription, index) => (
                                        <TableHeaderCell key={index}>{subscription}</TableHeaderCell>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPlans.map((plan, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        <TableCell>
                                            <TableCellLayout>
                                                <ShieldFilled style={{ color: tokens.colorBrandForeground1 }} />
                                                {plan}
                                            </TableCellLayout>
                                        </TableCell>
                                        {activeSubscriptions.map((subscription, colIndex) => {
                                            const row = tierMatrix.find(
                                                (r) => r.subscriptionName === subscription
                                            );
                                            const tier = row ? row[plan] || 'N/A' : 'N/A';
                                            return <TableCell key={colIndex}>{getTierBadge(tier)}</TableCell>;
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className={styles.footer}>
                        <CalendarLtrFilled />
                        <Body1>Last Updated: {lastUpdated || 'N/A'}</Body1>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DefenderPlanSection;
