import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Fluent UI Imports
import {
    makeStyles,
    shorthands,
    tokens,
    Card,
    CardHeader,
    Title3,
    Subtitle1,
    Body1,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Text,
    Spinner,
    Dropdown,
    Option,
} from '@fluentui/react-components';

// Fluent UI Icon Imports
import {
    bundleIcon,
    MoneyFilled,
    MoneyRegular,
    KeyFilled,
    KeyRegular,
    ArrowTrendingFilled,
    ArrowTrendingRegular,
} from '@fluentui/react-icons';

// Register Chart.js components
Chart.register(...registerables);

// Bundle Icons for consistency
const MoneyIcon = bundleIcon(MoneyFilled, MoneyRegular);
const KeyIcon = bundleIcon(KeyFilled, KeyRegular);
const ArrowTrendingIcon = bundleIcon(ArrowTrendingFilled, ArrowTrendingRegular);

// Use makeStyles for all styling
const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        ...shorthands.gap('24px'),
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        ...shorthands.gap('16px'),
    },
    metricCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...shorthands.padding('16px'),
        textAlign: 'center',
    },
    metricIcon: {
        fontSize: '32px',
        color: tokens.colorBrandForeground1,
        marginBottom: tokens.spacingVerticalS,
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        ...shorthands.gap('24px'),
    },
    chartContainer: {
        height: '350px',
        ...shorthands.padding(tokens.spacingVerticalL),
    },
    tableContainer: {
        maxHeight: '400px',
        overflowY: 'auto',
    },
});

// Reusable MetricCard component
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

const KeyVaultCostSection = ({ keyVaultCostData, granularity, setGranularity }) => {
    const styles = useStyles();
    const {
        monthlyCost = 0,
        totalOperations = 0,
        lastUpdated = 'N/A',
        // Assume a more detailed breakdown by Key Vault instance
        costBreakdownByVault = [],
        // Assume data for a cost trend chart
        costTrend = { labels: [], data: [] },
    } = keyVaultCostData;

    // Prepare data for the cost trend chart
    const costTrendChartData = {
        labels: costTrend.labels,
        datasets: [{
            label: 'Daily Cost ($)',
            data: costTrend.data,
            backgroundColor: '#0078d4',
        }],
    };

    // Check if data is still loading
    if (!keyVaultCostData || Object.keys(keyVaultCostData).length === 0) {
        return <Spinner label="Loading Key Vault cost data..." />;
    }

    return (
        <div className={styles.root}>
            <div className={styles.summaryGrid}>
                <MetricCard icon={<MoneyIcon />} title="Monthly Cost" value={`$${monthlyCost.toFixed(2)}`} />
                <MetricCard icon={<ArrowTrendingIcon />} title="Total Operations" value={totalOperations.toLocaleString()} />
                <MetricCard icon={<KeyIcon />} title="Active Vaults" value={costBreakdownByVault.length} />
            </div>

            <div className={styles.mainGrid}>
                <Card>
                    <CardHeader
                        header={<Subtitle1>Cost Trend</Subtitle1>}
                        action={
                            <Dropdown
                                value={granularity}
                                onOptionSelect={(_, data) => setGranularity(data.optionValue)}
                            >
                                <Option value="Daily">Daily</Option>
                                <Option value="Weekly">Weekly</Option>
                                <Option value="Monthly">Monthly</Option>
                            </Dropdown>
                        }
                    />
                    <div className={styles.chartContainer}>
                        <Bar data={costTrendChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </Card>
                <Card>
                    <CardHeader header={<Subtitle1>Cost Breakdown by Key Vault</Subtitle1>} />
                    <div className={styles.tableContainer}>
                        <Table aria-label="Key Vault Cost Breakdown by Vault Table">
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>Key Vault Name</TableHeaderCell>
                                    <TableHeaderCell>Operations</TableHeaderCell>
                                    <TableHeaderCell>Cost ($)</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {costBreakdownByVault.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.vaultName}</TableCell>
                                        <TableCell>{item.operations.toLocaleString()}</TableCell>
                                        <TableCell>${item.cost.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            <Body1 align="end" style={{ color: tokens.colorNeutralForeground2 }}>
                Last Updated: {lastUpdated}
            </Body1>
        </div>
    );
};

export default KeyVaultCostSection;
