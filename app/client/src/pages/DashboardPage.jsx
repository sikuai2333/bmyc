import React, { useMemo } from 'react';

import {

  ResponsiveContainer,

  LineChart,

  Line,

  XAxis,

  YAxis,

  Tooltip,

  Cell,

  PieChart,

  Pie,

  Legend,

  CartesianGrid,


} from 'recharts';

import { DIMENSION_COLORS } from '../constants';



function DashboardPage({



  overview,



  people,



  meetings,



  completionInsights,
  personDimensionStats,



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

  const completionSeries = useMemo(() => {

    if (!completionInsights || completionInsights.length === 0) return [];

    return completionInsights

      .slice()

      .sort((a, b) => a.month.localeCompare(b.month))

      .map((item, idx) => {

        const [year, month] = item.month.split('-').map(Number);

        return {

          key: item.month,

          month: `${month}月`,

          fullLabel: `${year}年${month}月`,

          count: item.count || 0,

          fill: DIMENSION_COLORS[idx % DIMENSION_COLORS.length]

        };

      });

  }, [completionInsights]);















  const dimensionDistribution = useMemo(() => {



    if (!personDimensionStats || personDimensionStats.length === 0) return [];



    const total = personDimensionStats.reduce((sum, item) => sum + (item.count || 0), 0);
    if (!total) return [];



    return personDimensionStats.map((item, idx) => ({



      name: item.category,



      value: item.count,



      percentage: Math.round(((item.count || 0) / total) * 100),



      fill: DIMENSION_COLORS[idx % DIMENSION_COLORS.length]



    }));



  }, [personDimensionStats]);







  if (loadError && visiblePeople.length === 0 && meetings.length === 0) {



    return (



      <section className="dashboard-empty">



        <h2>鏁版嵁鍔犺浇澶辫触</h2>



        <p>{loadError}</p>



        <button className="ghost-button slim" onClick={onRetry}>



          閲嶆柊鍔犺浇



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
              <p className="panel-subtitle">鏍稿績鏁版嵁姒傝</p>
            <h3>人才关注度排行</h3>
            </div>
            {isAdmin && (
              <button className="ghost-button slim" onClick={() => navigate('/profile')}>
                杩涘叆绠＄悊鍚庡彴
              </button>
            )}


          </div>



          <div className="kpi-grid">



            {overview.map((item) => (



              <article key={item.label} className="kpi-card">



            <p>按维度数量排序</p>



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



            <h3>浜烘墠鍚嶅崟</h3>



            <p>鐐瑰嚮杩涘叆妗ｆ璇︽儏</p>



          </div>



          {loading && <p className="muted">姝ｅ湪鍔犺浇...</p>}



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



                    {person.title} 路 {person.department}



                  </p>



                </div>



                <span className="value">{person.dimensionMonthCount || 0} 月</span>


              </button>



            ))}



          </div>



          <button className="ghost-button slim" onClick={() => navigate('/talent')}>



            鍓嶅線浜烘墠妗ｆ



          </button>



        </div>



      </div>







      <div className="dashboard-col dashboard-center">



        <div className="panel chart-panel">



          <div className="panel-head">



            <h3>月度完成趋势</h3>
            <p>按维度数量排序</p>



          </div>



          <div className="chart-grid">



            <div className="chart-card">



              <ResponsiveContainer width="100%" height="100%">



                <LineChart data={completionSeries} margin={{ top: 20, right: 24, bottom: 0, left: 0 }}>

                  <CartesianGrid stroke="#eef2ff" strokeDasharray="3 3" />

                  <XAxis dataKey="month" stroke="#7a89b5" />

                  <YAxis stroke="#7a89b5" width={36} allowDecimals={false} />

                  <Tooltip

                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e8eeff', borderRadius: 10 }}

                    labelStyle={{ color: '#4d5a7a' }}

                    formatter={(value) => [`${value} 项`, '完成事项']}

                    labelFormatter={(value, payload) =>

                      (payload && payload.length && payload[0].payload.fullLabel) || value

                    }

                  />

                  <Line

                    type="monotone"

                    dataKey="count"

                    stroke="#4b8dff"

                    strokeWidth={3}

                    dot={{ r: 4, stroke: '#4b8dff', strokeWidth: 2, fill: '#fff' }}

                    activeDot={{ r: 6 }}

                  />

                </LineChart>



              </ResponsiveContainer>



            </div>



            <div className="chart-card pie-card">



              {dimensionDistribution.length === 0 ? (



                <p className="chart-empty muted">暂无完成记录，待补充月度六维信息。</p>



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



                      label={({ name, value }) => `${name} ${value}条`}



                    >



                      {dimensionDistribution.map((entry) => (



                        <Cell key={entry.name} fill={entry.fill} stroke="none" strokeWidth={0} />



                      ))}



                    </Pie>



                    <Tooltip formatter={(value) => [`${value} 条`, "完成项"]} />



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



              <h3>浼氳娲诲姩姒傝</h3>



            </div>



            <button className="ghost-button slim" onClick={() => navigate('/meetings')}>



              鏌ョ湅鍏ㄩ儴



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



                  <span className="meeting-category-chip">{meeting.category || '浼氳'}</span>



                  <span>



                    {meeting.meetingDate} 路 {meeting.location}



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



          {loading && <p className="muted">姝ｅ湪鍒锋柊...</p>}



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


