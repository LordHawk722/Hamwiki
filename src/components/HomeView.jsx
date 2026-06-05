import TeamBoard from './TeamBoard.jsx'
import Donation from './Donation.jsx'

export default function HomeView() {
  return (
    <main className="home panel">
      <section className="home-hero">
        <h1>欢迎来到 Ham Wiki!</h1>
        <p>
          <strong>Ham Wiki</strong>
          致力于成为一个持续更新的面向业余无线电入门级爱好者的知识型网站，主要内容为基于新版题库和《业余无线电通信》而整理的考点解析，其他内容包括但不限于对相关术语的科普、对常见设备的介绍、对全国各地与业余无线电相关的操作流程的汇总说明等。我们希望通过这个平台，帮助更多的业余无线电爱好者更高效地准备考试，并在未来的业余无线电活动中更加熟练和自信。
          <br/>
          本项目受 <strong>OI Wiki</strong> 和 <strong>Ham CQ 社区</strong>的启发，在此一并致谢。
        </p>
      </section>

      <TeamBoard/>
      <Donation/>

    </main>)
}
