import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  CartesianGrid,
  LabelList
} from 'recharts';
import { DIMENSION_COLORS } from '../constants';

function DashboardPage({

  overview,

  people,

  meetings,

  insights,

  trendingPeople,

  selectedPerson,

  selectedMeeting,

  loading,

  setSelectedPersonId,

  setSelectedMeetingId,

  isAdmin,

  navigate,

  loadError,

  onRetry,

}) {

  const visiblePeople = people;

  const meetingsPreview = meetings;



  const monthlyActivitySeries = useMemo(() => {

    const parsedDates = [];

    const monthCounts = meetings.reduce((acc, meeting) => {

      const date = new Date(meeting.meetingDate);

      if (Number.isNaN(date.getTime())) {

        return acc;

      }

      parsedDates.push(date);

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      acc[monthKey] = (acc[monthKey] || 0) + 1;

      return acc;

    }, {});

    const anchor = parsedDates.length

      ? parsedDates.reduce((latest, current) => (current > latest ? current : latest), parsedDates[0])

      : new Date();

    const monthsToShow = 6;

    return Array.from({ length: monthsToShow }, (_, idx) => {

      const offset = monthsToShow - 1 - idx;

      const current = new Date(anchor.getFullYear(), anchor.getMonth() - offset, 1);

      const year = current.getFullYear();

      const month = current.getMonth() + 1;

      const key = `${year}-${String(month).padStart(2, '0')}`;

      return {

        key,

        month: `${month}月`,

        fullLabel: `${year}年${month}月`,

        count: monthCounts[key] || 0,

        fill: DIMENSION_COLORS[idx % DIMENSION_COLORS.length]

      };

    });

  }, [meetings]);



  const dimensionDistribution = useMemo(() => {

    if (!insights.length) return [];

    const total = insights.reduce((sum, item) => sum + (item.count || 0), 0) || 1;

    return insights.map((item, idx) => ({

      name: item.category,

      value: item.count,

      percentage: Math.round(((item.count || 0) / total) * 100),

      fill: DIMENSION_COLORS[idx % DIMENSION_COLORS.length]

    }));

  }, [insights]);



  if (loadError && visiblePeople.length === 0 && meetings.length === 0) {

    return (

      <section className="dashboard-empty">

        <h2>数据加载失败</h2>

        <p>{loadError}</p>

        <button className="ghost-button slim" onClick={onRetry}>

          重新加载

        </button>

      </section>

    );

  }



  return (

    <section className="dashboard-three">

      <div className="dashboard-col dashboard-left">

        <div className="panel stats-panel">

          <div className="panel-head inline">

            <div>
              <p className="panel-subtitle">核心数据概览</p>
              <h3>核心指标</h3>
            </div>
            {isAdmin && (
              <button className="ghost-button slim" onClick={() => navigate('/profile')}>
                进入管理后台
              </button>
            )}

          </div>

          <div className="kpi-grid">

            {overview.map((item) => (

              <article key={item.label} className="kpi-card">

                <p>{item.label}</p>

                <h3>

                  {item.value}

                  <span>{item.unit}</span>

                </h3>

              </article>

            ))}

          </div>

        </div>



        <div className="panel person-panel">

          <div className="panel-head">

            <h3>人才名单</h3>

            <p>点击进入档案详情</p>

          </div>

          {loading && <p className="muted">正在加载...</p>}

          <div className="dashboard-person-list">

            {visiblePeople.map((person) => (

              <button

                key={person.id}

                className={`dashboard-person ${selectedPerson?.id === person.id ? 'active' : ''}`}

                onClick={() => {

                  setSelectedPersonId(person.id);

                  navigate('/talent');

                }}

              >

                <div>

                  <p className="name">{person.name}</p>

                  <p className="meta">

                    {person.title} · {person.department}

                  </p>

                </div>

                <span className="value">{person.dimensionMonthCount || 0} 月</span>

              </button>

            ))}

          </div>

          <button className="ghost-button slim" onClick={() => navigate('/talent')}>

            前往人才档案

          </button>

        </div>

      </div>



      <div className="dashboard-col dashboard-center">

        <div className="panel chart-panel">

          <div className="panel-head">

            <h3>会议与画像趋势</h3>

          </div>

          <div className="chart-grid">

            <div className="chart-card">

              <ResponsiveContainer width="100%" height="100%">

                <ComposedChart data={monthlyActivitySeries} margin={{ top: 20, right: 24, bottom: 0, left: 0 }}>

                  <CartesianGrid stroke="#eef2ff" strokeDasharray="3 3" />

                  <XAxis dataKey="month" stroke="#7a89b5" />

                  <YAxis yAxisId="left" stroke="#7a89b5" width={36} allowDecimals={false} />

                  <Tooltip

                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e8eeff', borderRadius: 10 }}

                    labelStyle={{ color: '#4d5a7a' }}

                    formatter={(value) => [`${value} 场`, '会议/活动']}

                    labelFormatter={(value, payload) =>

                      (payload && payload.length && payload[0].payload.fullLabel) || value

                    }

                  />

                  <Bar dataKey="count" yAxisId="left" barSize={28} radius={[10, 10, 0, 0]}>

                    {monthlyActivitySeries.map((entry) => (

                      <Cell key={entry.key} fill={entry.fill} />

                    ))}

                    <LabelList

                      dataKey="count"

                      position="top"

                      offset={12}

                      fill="#4c5694"

                      formatter={(value) => `${value} 场`}

                    />

                  </Bar>

                </ComposedChart>

              </ResponsiveContainer>

            </div>

            <div className="chart-card pie-card">

              {dimensionDistribution.length === 0 ? (

                <p className="chart-empty muted">暂无画像统计，导入人才维度后将自动生成。</p>

              ) : (

                <ResponsiveContainer width="100%" height="100%">

                  <PieChart>

                    <Pie

                      data={dimensionDistribution}

                      dataKey="value"

                      nameKey="name"

                      cx="50%"

                      cy="50%"

                      outerRadius={80}

                      stroke="none"

                      strokeWidth={0}

                      label={({ name, percentage }) => `${name} ${percentage}%`}

                    >

                      {dimensionDistribution.map((entry) => (

                        <Cell key={entry.name} fill={entry.fill} stroke="none" strokeWidth={0} />

                      ))}

                    </Pie>

                    <Tooltip />

                    <Legend verticalAlign="bottom" height={36} />

                  </PieChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>

        </div>

      </div>



      <div className="dashboard-col dashboard-right">

        <div className="panel meeting-panel">

          <div className="panel-head inline">

            <div>

              <h3>会议活动概览</h3>

            </div>

            <button className="ghost-button slim" onClick={() => navigate('/meetings')}>

              查看全部

            </button>

          </div>

          <div className="meeting-board-list">

            {meetingsPreview.map((meeting) => (

              <button

                key={meeting.id}

                className={`meeting-board-item ${selectedMeeting?.id === meeting.id ? 'active' : ''}`}

                onClick={() => {

                  setSelectedMeetingId(meeting.id);

                  navigate('/meetings');

                }}

              >

                <p className="name">{meeting.topic}</p>

                <div className="meta meeting-meta">

                  <span className="meeting-category-chip">{meeting.category || '会议'}</span>

                  <span>

                    {meeting.meetingDate} · {meeting.location}

                  </span>

                </div>

              </button>

            ))}

          </div>

        </div>



        <div className="panel talent-stream">

          <div className="panel-head">

            <h3>人才关注度排行</h3>

            <p>按维度数量排序</p>

          </div>

          {loading && <p className="muted">正在刷新...</p>}

          <div className="heat-list">

            {trendingPeople.map((person, index) => (

              <button

                key={person.id}

                className="heat-item"

                onClick={() => {

                  setSelectedPersonId(person.id);

                  navigate('/talent');

                }}

              >

                <span className="rank">{String(index + 1).padStart(2, '0')}</span>

                <div>

                  <p className="name">

                    {person.name} <small>{person.title}</small>

                  </p>

                  <p className="meta">{person.department}</p>

                </div>

                <span className="value">{person.dimensionMonthCount || 0} 月</span>

              </button>

            ))}

          </div>
        </div>
        
      </div>
    </section>
  );
}

export default DashboardPage;
