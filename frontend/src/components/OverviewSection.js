import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import {
    makeStyles, shorthands, tokens, Title3, Subtitle1, Body1, Button, Card, CardHeader,
    Divider, Dropdown, Option, Table, TableHeader, TableRow, TableHeaderCell, TableBody,
    TableCell, Text, Spinner
} from '@fluentui/react-components';
import {
    bundleIcon, MoneyFilled, MoneyRegular, ShieldFilled, ShieldRegular, PeopleFilled, PeopleRegular,
    LayerFilled, LayerRegular, DocumentArrowDownFilled, DocumentArrowDownRegular
} from '@fluentui/react-icons';

Chart.register(...registerables);

const MoneyIcon = bundleIcon(MoneyFilled, MoneyRegular);
const ShieldIcon = bundleIcon(ShieldFilled, ShieldRegular);
const PeopleIcon = bundleIcon(PeopleFilled, PeopleRegular);
const LayerIcon = bundleIcon(LayerFilled, LayerRegular);
const ExportIcon = bundleIcon(DocumentArrowDownFilled, DocumentArrowDownRegular);

const useStyles = makeStyles({
    root: { display: 'flex', flexDirection: 'column', ...shorthands.gap('24px') },
    loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', ...shorthands.gap('16px') },
    metricCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...shorthands.padding('16px'), textAlign: 'center', backgroundColor: tokens.colorNeutralBackground1, ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2), transitionProperty: 'box-shadow, transform', transitionDuration: tokens.durationNormal, ':hover': { boxShadow: tokens.shadow8, transform: 'translateY(-2px)' } },
    metricIcon: { fontSize: '32px', color: tokens.colorBrandForeground1, marginBottom: tokens.spacingVerticalS },
    chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', ...shorthands.gap('24px') },
    chartCard: { backgroundColor: tokens.colorNeutralBackground1, ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2), ...shorthands.padding(tokens.spacingVerticalS) },
    chartContainer: { height: '350px', ...shorthands.padding(tokens.spacingVerticalL) },
    tableCard: { display: 'flex', flexDirection: 'column', ...shorthands.gap(tokens.spacingVerticalM), ...shorthands.padding(tokens.spacingHorizontalL, tokens.spacingVerticalL), backgroundColor: tokens.colorNeutralBackground1, ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2) },
    tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', ...shorthands.gap('16px') },
    tableContainer: { maxHeight: '400px', overflowY: 'auto' },
});

const MetricCard = ({ icon, title, value }) => {
    const styles = useStyles();
    return (
        <Card className={styles.metricCard}>
            <div className={styles.metricIcon}>{icon}</div>
            <Text size={800} weight="semibold">{value}</Text>
            <Body1>{title}</Body1>
        </Card>
    );
};

// Component now receives fewer, more consolidated props
const OverviewSection = ({
    loading,
    overviewData,
    selectedSubscription,
    setSelectedSubscription,
    exportToCSV,
}) => {
    const styles = useStyles();

    if (loading || !overviewData) {
        return (
            <div className={styles.loadingContainer}>
                <Spinner size="huge" label="Loading overview data..." />
            </div>
        );
    }

    // --- NO MORE FRONTEND CALCULATIONS ---
    // All data comes directly from the overviewData object provided by the backend

    const {
        totalCost,
        totalSecurityCost,
        securityComponents,
        subscriptions,
        resourceGroupCount,
        topDefenderResources,
    } = overviewData;

    const nonSecurityCost = totalCost - totalSecurityCost;

    // --- Prepare data for tables (formatting only) ---
    const securityCostBreakdown = Object.entries(securityComponents).map(([name, cost]) => ({
        name,
        cost: cost.toFixed(2),
        percentage: totalCost > 0 ? ((cost / totalCost) * 100).toFixed(2) : "0.00",
    }));

    const subscriptionCostBreakdown = subscriptions.map(sub => ({
        name: sub.displayName,
        cost: sub.cost.toFixed(2),
        percentage: totalCost > 0 ? ((sub.cost / totalCost) * 100).toFixed(2) : "0.00",
    }));

    // --- Chart Data Preparations ---
    const costBreakdownChartData = {
        labels: ['Security Costs', 'Non-Security Costs'],
        datasets: [{ label: 'Cost ($)', data: [totalSecurityCost, nonSecurityCost], backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'] }],
    };
    const securityComponentChartData = {
        labels: Object.keys(securityComponents),
        datasets: [{ label: 'Cost ($)', data: Object.values(securityComponents), backgroundColor: tokens.colorBrandBackground }],
    };
    const subscriptionCostChartData = {
        labels: subscriptions.map(sub => sub.displayName),
        datasets: [{ label: 'Cost ($)', data: subscriptions.map(sub => sub.cost), backgroundColor: ['#115ea3', '#2899f5', '#6cbbf7', '#aedcf9'], borderWidth: 1 }],
    };

    return (
        <div className={styles.root}>
            <div className={styles.summaryGrid}>
                <MetricCard icon={<MoneyIcon />} title="Total Cost" value={`$${totalCost.toFixed(2)}`} />
                <MetricCard icon={<ShieldIcon />} title="Security Cost" value={`$${totalSecurityCost.toFixed(2)}`} />
                <MetricCard icon={<PeopleIcon />} title="Subscriptions" value={subscriptions.length} />
                <MetricCard icon={<LayerIcon />} title="Resource Groups" value={resourceGroupCount} />
            </div>

            <div className={styles.chartsGrid}>
                <Card className={styles.chartCard}>
                    <CardHeader header={<Subtitle1>Cost Breakdown (Security vs. Non-Security)</Subtitle1>} />
                    <div className={styles.chartContainer}><Bar data={costBreakdownChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                </Card>
                <Card className={styles.chartCard}>
                    <CardHeader header={<Subtitle1>Security Component Costs</Subtitle1>} />
                    <div className={styles.chartContainer}><Bar data={securityComponentChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                </Card>
                <Card className={styles.chartCard}>
                    <CardHeader header={<Subtitle1>Subscription Costs</Subtitle1>} />
                    <div className={styles.chartContainer}><Pie data={subscriptionCostChartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                </Card>
            </div>

            <Card className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <Title3>Detailed Cost Breakdown</Title3>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Dropdown
                            value={selectedSubscription || "All Subscriptions"}
                            onOptionSelect={(_, data) => setSelectedSubscription(data.optionValue === 'All' ? '' : data.optionValue)}
                        >
                            <Option key="all" text="All Subscriptions" value="All">All Subscriptions</Option>
                            {subscriptions.map(sub => (
                                <Option key={sub.subscriptionId} text={sub.displayName}>{sub.displayName}</Option>
                            ))}
                        </Dropdown>
                        <Button icon={<ExportIcon />} onClick={exportToCSV}>Export</Button>
                    </div>
                </div>
                <Divider />

                <Subtitle1>Security Component Costs</Subtitle1>
                <div className={styles.tableContainer}>
                    <Table aria-label="Security cost breakdown table">
                        <TableHeader><TableRow><TableHeaderCell>Component</TableHeaderCell><TableHeaderCell>Cost ($)</TableHeaderCell><TableHeaderCell>Percentage (%)</TableHeaderCell></TableRow></TableHeader>
                        <TableBody>
                            {securityCostBreakdown.map((item) => (
                                <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell>{`$${item.cost}`}</TableCell><TableCell>{`${item.percentage}%`}</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <Subtitle1>Subscription Costs</Subtitle1>
                <div className={styles.tableContainer}>
                    <Table aria-label="Subscription cost breakdown table">
                        <TableHeader><TableRow><TableHeaderCell>Subscription</TableHeaderCell><TableHeaderCell>Cost ($)</TableHeaderCell><TableHeaderCell>Percentage (%)</TableHeaderCell></TableRow></TableHeader>
                        <TableBody>
                            {subscriptionCostBreakdown.map((item) => (
                                <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell>{`$${item.cost}`}</TableCell><TableCell>{`${item.percentage}%`}</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <Subtitle1>Top 5 Defender Resources</Subtitle1>
                <div className={styles.tableContainer}>
                    <Table aria-label="Top 5 Defender Resources table">
                        <TableHeader><TableRow><TableHeaderCell>Resource Name</TableHeaderCell><TableHeaderCell>Subscription</TableHeaderCell><TableHeaderCell>Meter SubCategory</TableHeaderCell><TableHeaderCell>Cost ($)</TableHeaderCell></TableRow></TableHeader>
                        <TableBody>
                            {topDefenderResources.map((item) => (
                                <TableRow key={item.resourceId}><TableCell>{item.resourceName}</TableCell><TableCell>{item.subscriptionName}</TableCell><TableCell>{item.meterSubCategory}</TableCell><TableCell>{`$${(item.cost || 0).toFixed(2)}`}</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default OverviewSection;