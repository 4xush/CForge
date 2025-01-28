import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Grid
} from '@mui/material';
import { BookOpen, Brain, Code, RotateCw, AlertCircle } from 'lucide-react';
import { useLeetCodeStats } from '../../hooks/useLeetCodeStats';

import UserLevelCard from "./LeetCodeLevelCard";


const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const LeetCodeDashboard = ({ leetcodeData }) => {
    const username = window.location.pathname.split('/').pop();
    const { data, loading, error, refreshStats } = useLeetCodeStats(username);
    const [tabValue, setTabValue] = useState(0);
    const currentData = leetcodeData;
    console.log(currentData);
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="64px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ width: '100%' }}>
                {error}
            </Alert>
        );
    }

    if (!data) {
        return (
            <Alert severity="info" sx={{ width: '100%' }}>
                No data available for this user.
            </Alert>
        );
    }

    // Calculate totals
    const totalProblems = {
        advanced: data.advanced.reduce((acc, curr) => acc + curr.problemsSolved, 0),
        intermediate: data.intermediate.reduce((acc, curr) => acc + curr.problemsSolved, 0),
        fundamental: data.fundamental.reduce((acc, curr) => acc + curr.problemsSolved, 0)
    };

    // Color schemes
    const categoryColors = {
        advanced: '#3b82f6',
        intermediate: '#10b981',
        fundamental: '#f59e0b'
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'advanced': return <Brain />;
            case 'intermediate': return <Code />;
            case 'fundamental': return <BookOpen />;
            default: return null;
        }
    };

    // Prepare chart data
    const chartData = Object.entries(data).flatMap(([category, tags]) =>
        tags.map(tag => ({
            ...tag,
            category,
            color: categoryColors[category]
        }))
    );

    return (
        <div className="container mx-auto p-6 max-w-7xl bg-gray-100">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold ">{username}'s LeetCode Progress</h1>
                <button
                    onClick={refreshStats}
                    className="p-2 hover:bg-accent rounded-full transition-colors"
                    title="Refresh stats"
                >
                    <RotateCw className="w-5 h-5" />
                </button>
            </div>


            {/* Summary Cards */}
            <Grid container spacing={3} mb={4}>
                {Object.entries(totalProblems).map(([category, total]) => (
                    <Grid item xs={12} md={4} key={category}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                                        {category}
                                    </Typography>
                                    {getCategoryIcon(category)}
                                </Box>
                                <Typography variant="h4">{total}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Problems Included
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Main Content */}
            <Paper sx={{ width: '100%', mb: 4 }}>
                <Tabs
                    value={tabValue}
                    onChange={(event, newValue) => setTabValue(newValue)}
                    centered
                >
                    <Tab label="Overview" />
                    <Tab label="Detailed Stats" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Problem Solving Distribution
                            </Typography>
                            <Box sx={{ height: 400 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <XAxis
                                            dataKey="tagName"
                                            angle={-45}
                                            textAnchor="end"
                                            height={100}
                                            interval={0}
                                        />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="problemsSolved">
                                            {chartData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Tag</TableCell>
                                    <TableCell align="right">Problems Included</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.entries(data).flatMap(([category, tags]) =>
                                    tags.map((tag) => (
                                        <TableRow key={`${category}-${tag.tagName}`}>
                                            <TableCell sx={{ textTransform: 'capitalize' }}>{category}</TableCell>
                                            <TableCell>{tag.tagName}</TableCell>
                                            <TableCell align="right">{tag.problemsSolved}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>
            </Paper>
            <UserLevelCard leetcodeData={currentData} />
        </div>
    );
};

export default LeetCodeDashboard;