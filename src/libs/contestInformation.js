import * as moment from "moment";
import { getStandingsData } from "./data";
import { getLS } from "./global";

class ContestInformation{
    /**
     * @param {string} [contestScreenName]
     * @param {number[]} [participatableRange]
     * @param {number[]} [ratedRange]
     * @param {number} [penalty]
     * @param {Array.<Array.<string,number>>} [topPageTasks]
     */
    constructor(contestScreenName, participatableRange, ratedRange, penalty, topPageTasks) {
        this.ContestScreenName = contestScreenName;
        this.ParticipatableRange = participatableRange;
        this.RatedRange = ratedRange;
        this.Penalty = penalty;
        this.TopPageTasks = topPageTasks;
    }
    /**
     * @param {boolean} [cached]
     * @return {Task[]}
     */
    async getTasks(cached=true) {
        if (cached) {
            const tasksFromLS = getLS(`atcoder-userscript-libs-tasks-${this.ContestScreenName}`);
            if (tasksFromLS) return tasksFromLS.map(x => Task.fromJson(x));
            else return (await fetchTasks(this.ContestScreenName, this.TopPageTasks));
        } else return (await fetchTasks(this.ContestScreenName, this.TopPageTasks));

        async function fetchTasks(contestScreenName, topPageTasks) {
            try {
                const standings = await getStandingsData(contestScreenName);
                const standingsTaskInfo = standings.TaskInfo;
                const tasks = [];
                for (const standingsTask of standingsTaskInfo) {
                    const assignment = standingsTask.Assignment;
                    const taskScreenName = standingsTask.TaskScreenName;
                    let point;
                    if (topPageTasks.length) {
                        point = topPageTasks.find(x => x[0] === assignment)[1];
                    } else {
                        point = await fetchTaskPoint(taskScreenName);
                    }
                    tasks.push(new Task(assignment, point, taskScreenName));
                }
                setLS(`atcoder-userscript-libs-tasks-${contestScreenName}`, tasks);
                return tasks;
            } catch(e) {
                return [];
            }

            async function fetchTaskPoint(taskScreenName) {
                const taskPageDom = await $.ajax(`https://atcoder.jp/contests/${contestScreenName}/tasks/${taskScreenName}`).then(x => new DOMParser().parseFromString(x, "text/html"));
                const point = parseInt($(taskPageDom).find("#task-statement").find("var").eq(0).text());
                if (!isNaN(point)) return point;
                else throw new Error();
            }
        }
    }
}

class Task {
    /**
     * @param {string} assignment
     * @param {number} point
     * @param {string} taskScreenName
     */
    constructor(assignment, point, taskScreenName) {
        this.assignment = assignment;
        this.point = point;
        this.taskScreenName = taskScreenName;
    }
    toJSON() {
        return {
            assignment: this.assignment,
            point: this.point,
            taskScreenName: this.taskScreenName
        };
    }
    static fromJson(obj) {
        return new this(obj.assignment, obj.point, obj.taskScreenName);
    }
}

/**
 * トップページに表示されるコンテスト情報を取得
 * @param {string} [contestScreenName] コンテスト名
 * @return {Promise<ContestInformation>} コンテスト情報を返すPromise
 */
export async function fetchContestInformation(contestScreenName) {
    return new Promise(async (resolve) => {
        const topPageDom = await $.ajax(`https://atcoder.jp/contests/${contestScreenName}`).then(x => new DOMParser().parseFromString(x, "text/html"));

        const dataParagraphSmall = topPageDom.getElementsByClassName("small")[0];
        const dataSmall = Array.from(dataParagraphSmall.children).map(x => x.innerText.split(':')[1].trim());

        let pointParagraph = $(topPageDom).find("h3:contains(配点)+section tbody").children();  // 新ABC
        if (!pointParagraph.length) {
            pointParagraph = $(topPageDom).find("h3:contains(配点)~.row tbody").children();  // AGC
        }
        const taskPoints = [];
        pointParagraph.each((_, tr) => {
            const assignment = $(tr).children().eq(0).text();
            const point = parsePointString($(tr).children().eq(1).text());
            if (!isNaN(point)) taskPoints.push([assignment, point]);
        });

        resolve(new ContestInformation(
            contestScreenName,
            parseRangeString(dataSmall[0]),
            parseRangeString(dataSmall[1]),
            parseDurationString(dataSmall[2]),
            taskPoints
        ));
    });

    /**
     * 範囲を表す文字列をパースする
     * @param {string} [s] 範囲を表す文字列
     * @return {number[]} 範囲を表す配列
     */
    function parseRangeString(s){
        if (s === 'All') return [0, Infinity];
        if (s.indexOf('~') === -1) return [0, -1];
        let res = s.split('~').map(x => parseInt(x.trim()));
        if (isNaN(res[0])) res[0] = 0;
        if (isNaN(res[1])) res[1] = Infinity;
        return res;
    }
    /**
     * 期間を表す文字列をパースする
     * @param {string} [s] 期間を表す文字列
     * @return {number} パース結果(ミリ秒)
     */
    function parseDurationString(s) {
        if (s === "None" || s === "なし") return 0;
        if (!/(\d+[^\d]+)/.test(s)) return NaN;
        const dic = {ヶ月: "month", 日: "day", 時間: "hour", 分: "minute", 秒: "second"};
        let res = {};
        s.match(/(\d+[^\d]+)/g).forEach(x => {
            const trimmed = x.trim(' ','s');
            const num = trimmed.match(/\d+/)[0];
            const unit = trimmed.match(/[^\d]+/)[0];
            const convertedUnit = dic[unit]||unit;
            res[convertedUnit] = num;
        });
        return moment.duration(res).asMilliseconds();
    }
    /**
     * 配点を表す文字列をパースする
     * @param {string} [s] 配点を表す文字列
     * @return {number} パース結果(整数かNaN)
     */
    function parsePointString(s) {
        if (s.match(/\d+/)) return parseInt(s);
        if (s.match(/(\d+)\(\d+\)/)) return s.match(/(\d+)\(\d+\)/)[1];  // 部分点
        return NaN;
    }
}
