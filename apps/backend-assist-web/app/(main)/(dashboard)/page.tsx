"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@workspace/ui/components/chart';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';
import { Users, Package, CheckCircle, FolderOpen, Clock, TrendingUp, TrendingDown, Smile, Meh, Frown, ArrowUpRight, ArrowDownRight, ExternalLink, Download } from 'lucide-react';

const Dashboard = () => {
  // Static data for the trend chart
  const trendData = [
    { time: '0', value1: 30, value2: 75 },
    { time: '1', value1: 28, value2: 45 },
    { time: '2', value1: 32, value2: 35 },
    { time: '3', value1: 38, value2: 38 },
    { time: '4', value1: 45, value2: 65 },
    { time: '5', value1: 52, value2: 68 },
    { time: '6', value1: 65, value2: 85 },
    { time: '7', value1: 58, value2: 55 },
    { time: '8', value1: 48, value2: 35 },
    { time: '9', value1: 52, value2: 48 },
    { time: '10', value1: 68, value2: 78 },
    { time: '11', value1: 75, value2: 85 },
    { time: '12', value1: 70, value2: 75 },
    { time: '13', value1: 55, value2: 55 },
    { time: '14', value1: 42, value2: 38 },
    { time: '15', value1: 35, value2: 42 },
  ];

  const responseTimeData = [
    { day: 'Mon', time: 45 },
    { day: 'Tue', time: 52 },
    { day: 'Wed', time: 38 },
    { day: 'Thu', time: 65 },
    { day: 'Fri', time: 48 },
    { day: 'Sat', time: 35 },
    { day: 'Sun', time: 42 },
  ];

  const stats = [
    { title: 'Unresolved', value: '89,935', change: '+1.01%', changeValue: '10.2', trend: 'up', icon: Users },
    { title: 'Overdue', value: '23,283', change: '+0.49%', changeValue: '3.1', trend: 'up', icon: Package },
    { title: 'Due today', value: '46,827', change: '-0.91%', changeValue: '2.56', trend: 'down', icon: CheckCircle },
    { title: 'Open', value: '124,854', change: '+1.51%', changeValue: '7.2', trend: 'up', icon: FolderOpen },
    { title: 'On hold', value: '124,854', change: '+1.51%', changeValue: '7.2', trend: 'up', icon: Clock },
    { title: 'Unassigned', value: '124,854', change: '+1.51%', changeValue: '7.2', trend: 'up', icon: Users },
  ];

  const chartConfig = {
    value1: {
      label: "Current",
      color: "hsl(var(--primary))",
    },
    value2: {
      label: "Previous",
      color: "hsl(var(--muted-foreground))",
    },
  };

  const undeliveredEmails = [
    { name: 'Daniel Zarick', email: 'DanielZarick@gmail.com', subject: 'Meeting Follow-up Required', time: '2h ago' },
    { name: 'Sarah Mitchell', email: 'sarah.mitchell@company.com', subject: 'Invoice Payment Issue', time: '4h ago' },
    { name: 'Alex Johnson', email: 'alex.j@techcorp.com', subject: 'Technical Support Request', time: '5h ago' },
    { name: 'Emily Rodriguez', email: 'e.rodriguez@business.com', subject: 'Account Access Problem', time: '6h ago' },
    { name: 'Michael Chen', email: 'mchen@enterprise.net', subject: 'Urgent: System Downtime', time: '8h ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your customer support metrics in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <ExternalLink className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div> */}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {stat.trend === 'up' ? (
                      <span className="text-green-600 flex items-center mr-1">
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                        {stat.changeValue}%
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center mr-1">
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                        {stat.changeValue}%
                      </span>
                    )}
                    <span>{stat.change} this week</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Trends</CardTitle>
                <CardDescription>Activity patterns throughout the day</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Day</Button>
                <Button variant="ghost" size="sm">Week</Button>
                <Button variant="ghost" size="sm">Month</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorValue1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value1"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorValue1)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="value2"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Right Side Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ticket Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Resolved</p>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">2,637</p>
                    <p className="text-xs text-red-500 flex items-center justify-end">
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      5%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Received</p>
                      <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">1,567</p>
                    <p className="text-xs text-green-500 flex items-center justify-end">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      5%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Response Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                      <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">First Response</p>
                      <p className="text-xs text-muted-foreground">Average time</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">26m</p>
                    <p className="text-xs text-red-500 flex items-center justify-end">
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      5%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                      <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Resolution Time</p>
                      <p className="text-xs text-muted-foreground">Average time</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">15m</p>
                    <p className="text-xs text-green-500 flex items-center justify-end">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      5%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unresolved Tickets */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Unresolved Tickets</CardTitle>
                <CardDescription>Tickets awaiting action</CardDescription>
              </div>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Unassigned
                  </span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="space-y-2">
                  {['Skylight.Inc', 'TechCorp Ltd', 'Digital Solutions'].map((client, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{client}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Assigned
                  </span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="space-y-2">
                  {['Global Systems', 'Innovation Hub', 'Enterprise Co'].map((client, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{client}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Undelivered Emails */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Undelivered Emails</CardTitle>
                <CardDescription>Failed delivery attempts</CardDescription>
              </div>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {undeliveredEmails.map((email, index) => (
                <div key={index} className="flex items-start gap-4 group cursor-pointer">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${email.name}`} />
                    <AvatarFallback>{email.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">{email.name}</p>
                      <span className="text-xs text-muted-foreground">{email.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{email.email}</p>
                    <p className="text-xs font-medium text-foreground/80 truncate">{email.subject}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Satisfaction */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Customer Satisfaction</CardTitle>
                <CardDescription>Feedback metrics</CardDescription>
              </div>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Positive</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">87%</p>
                </div>
                <Smile className="h-10 w-10 text-green-600 dark:text-green-400" strokeWidth={1.5} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Neutral</p>
                    <Meh className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">8%</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Negative</p>
                    <Frown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">5%</p>
                </div>
              </div>

              <div className="pt-2">
                <ChartContainer config={{ time: { label: "Response Time", color: "hsl(var(--primary))" } }} className="h-[100px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={responseTimeData}>
                      <XAxis dataKey="day" hide />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="time"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        className="opacity-80 hover:opacity-100 transition-opacity"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;