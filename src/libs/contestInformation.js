import * as moment from "moment";

class ContestInformation{
    /**
     * @param {number[]} [participatableRange]
     * @param {number[]} [ratedRange]
     * @param {number} [penalty]
     */
    constructor(participatableRange, ratedRange, penalty){
        this.ParticipatableRange = participatableRange;
        this.RatedRange = ratedRange;
        this.Penalty = penalty;
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
        const dataParagraph = topPageDom.getElementsByClassName("small")[0];
        const data = Array.from(dataParagraph.children).map(x => x.innerText.split(':')[1].trim());
        resolve(new ContestInformation(parseRangeString(data[0]), parseRangeString(data[1]), parseDurationString(data[2])));
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
}
