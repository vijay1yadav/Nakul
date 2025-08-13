import React, { useState, useMemo } from 'react';

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
    Text,
    Toolbar,
    ToolbarButton,
} from '@fluentui/react-components';

// Fluent UI Icon Imports
import {
    ShieldFilled,
    CalendarLtrFilled,
    DocumentArrowDownFilled,
} from '@fluentui/react-icons';

// Use makeStyles for all styling
const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('16px'),
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
        ...shorthands.overflow('auto'),
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        ...shorthands.gap(tokens.spacingHorizontalS),
        color: tokens.colorNeutralForeground2,
        paddingTop: tokens.spacingVerticalL,
    },
    totalRow: {
        backgroundColor: tokens.colorNeutralBackground2,
        fontWeight: tokens.fontWeightSemibold,
    },
    // Updated styling to place price and status side-by-side with a small gap
    costAndStatus: {
        display: 'flex',
        alignItems: 'center',
        ...shorthands.gap('8px'),
    },
    noData: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
    },
    sectionGap: {
        ...shorthands.padding('24px', '0', '0', '0'),
    },
});

const DefenderCostSection = ({ defenderCostData, defenderPlanData, granularity, setGranularity, loading }) => {
    const styles = useStyles();

    const { costMatrix = [], subscriptions = [], meterSubCategories = [], lastUpdated } = defenderCostData || {};
    const { tierMatrix = [] } = defenderPlanData || {};

    const [subscriptionFilter, setSubscriptionFilter] = useState('all');

    const { activeSubscriptions, serviceStatusMap, totalRow, serviceTotalCosts } = useMemo(() => {
        const activeSubs = subscriptionFilter === 'all'
            ? subscriptions
            : subscriptions.filter(sub => sub.rawName === subscriptionFilter);

        const statusMap = {};
        tierMatrix.forEach(sub => {
            statusMap[sub.subscriptionName] = {};
            meterSubCategories.forEach(service => {
                const tier = sub[service] || 'Off';
                statusMap[sub.subscriptionName][service] = tier.includes('Off') ? 'Off' : 'On';
            });
        });

        const totals = {};
        activeSubs.forEach(sub => {
            totals[sub.rawName] = meterSubCategories.reduce((sum, service) => {
                const costRow = costMatrix.find(row => row.meterSubCategory === service);
                return sum + (costRow?.[sub.rawName] || 0);
            }, 0);
        });

        const serviceTotals = {};
        meterSubCategories.forEach(service => {
            serviceTotals[service] = activeSubs.reduce((sum, sub) => {
                const costRow = costMatrix.find(row => row.meterSubCategory === service);
                return sum + (costRow?.[sub.rawName] || 0);
            }, 0);
        });

        return { activeSubscriptions: activeSubs, serviceStatusMap: statusMap, totalRow: totals, serviceTotalCosts: serviceTotals };
    }, [subscriptionFilter, subscriptions, tierMatrix, meterSubCategories, costMatrix]);

    if (loading) {
        return <Spinner label="Loading Defender data..." />;
    }

    if (!costMatrix.length || !subscriptions.length) {
        return (
            <Card>
                <div className={styles.noData}>
                    <Body1>No Defender data available to display.</Body1>
                </div>
            </Card>
        );
    }

    // Calculate total cost for all services
    const totalOverallCost = Object.values(serviceTotalCosts).reduce((sum, cost) => sum + cost, 0);

    return (
        <div className={styles.root}>
            <Card>
                <CardHeader
                    header={<Title3>Microsoft Defender for Cloud: Cost Overview</Title3>}
                    action={
                        <Toolbar>
                            <ToolbarButton
                                icon={<DocumentArrowDownFilled />}
                                onClick={() => console.log("Exporting CSV...")}
                            >
                                Export CSV
                            </ToolbarButton>
                        </Toolbar>
                    }
                />
                <div className={styles.controls}>
                    {/* The granularity filter remains at the top as it applies to both tables */}
                    <Dropdown
                        value={granularity}
                        onOptionSelect={(_, data) => setGranularity(data.optionValue)}
                    >
                        <Option value="Daily">Daily</Option>
                        <Option value="Weekly">Weekly</Option>
                        <Option value="Monthly">Monthly</Option>
                    </Dropdown>
                </div>

                <div className={styles.tableContainer}>
                    <Table aria-label="Defender Total Service Costs Table">
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>Service / Component</TableHeaderCell>
                                <TableHeaderCell>Total Cost</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(serviceTotalCosts).map(([service, cost], rowIndex) => (
                                <TableRow key={rowIndex}>
                                    <TableCell>
                                        <TableCellLayout media={<ShieldFilled style={{ color: tokens.colorBrandForeground1 }} />}>
                                            {service}
                                        </TableCellLayout>
                                    </TableCell>
                                    <TableCell>
                                        <Text>${cost.toFixed(2)}</Text>
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow className={styles.totalRow}>
                                <TableCell>
                                    <Text weight="semibold">Overall Total Cost</Text>
                                </TableCell>
                                <TableCell>
                                    <Text weight="semibold">${totalOverallCost.toFixed(2)}</Text>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                {/* Second Table for detailed costs per subscription */}
                {/* The subscription filter has been moved to this section */}
                <div className={styles.sectionGap}>
                    <Title3>Costs by Subscription</Title3>
                    <div className={styles.controls}>
                        <Dropdown
                            value={subscriptionFilter}
                            onOptionSelect={(_, data) => setSubscriptionFilter(data.optionValue)}
                        >
                            <Option value="all">All Subscriptions</Option>
                            {subscriptions.map((sub, index) => (
                                <Option key={index} value={sub.rawName}>{sub.name}</Option>
                            ))}
                        </Dropdown>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <Table aria-label="Defender Cost and Plan Details Table">
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>Service / Component</TableHeaderCell>
                                {activeSubscriptions.map((sub, index) => (
                                    <TableHeaderCell key={index}>{sub.name}</TableHeaderCell>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {meterSubCategories.map((service, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    <TableCell>
                                        <TableCellLayout media={<ShieldFilled style={{ color: tokens.colorBrandForeground1 }} />}>
                                            {service}
                                        </TableCellLayout>
                                    </TableCell>
                                    {activeSubscriptions.map((sub, colIndex) => {
                                        const cost = costMatrix.find(row => row.meterSubCategory === service)?.[sub.rawName] || 0;
                                        const tierRow = tierMatrix.find(r => r.subscriptionName === sub.rawName);
                                        const tier = tierRow ? tierRow[service] || 'Off' : 'Off';
                                        const status = tier.includes('Off') ? 'Off' : 'On';
                                        return (
                                            <TableCell key={colIndex}>
                                                <div className={styles.costAndStatus}>
                                                    <Text>${cost.toFixed(2)}</Text>
                                                    <Badge color={status === 'On' ? 'success' : 'danger'}>{status}</Badge>
                                                </div>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                            <TableRow className={styles.totalRow}>
                                <TableCell>
                                    <Text weight="semibold">Total Cost</Text>
                                </TableCell>
                                {activeSubscriptions.map((sub, colIndex) => (
                                    <TableCell key={colIndex}>
                                        <Text weight="semibold">${(totalRow[sub.rawName] || 0).toFixed(2)}</Text>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <div className={styles.footer}>
                    <CalendarLtrFilled />
                    <Body1>Last Updated: {lastUpdated || 'N/A'}</Body1>
                </div>
            </Card>
        </div>
    );
};

export default DefenderCostSection;
