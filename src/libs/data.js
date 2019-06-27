import * as $ from 'jquery';

/**
 * @typedef {{IsRated: boolean, Place: number, OldRating: number, NewRating: number, Performance: number, InnerPerformance: number, ContestScreenName: string, ContestName: string, EndTime : string}} UserResult
 * @typedef {{Assignment: string, TaskName: string, TaskScreenName: string}} TaskInfo
 * @typedef {{Count: number, Failure: number, Penalty: number, Score: number, Elapsed: number, Status: number, Pending: boolean, Frozen: boolean, Additional: null}} StandingResult
 * @typedef {{Rank: number, Additional: null, UserName: string, UserScreenName: string, UserIsDeleted: boolean, Affiliation: string, Country: string, Rating: number, OldRating: number, IsRated: boolean, Competitions: number, TaskResults: StandingResult[], TotalResult: StandingResult}} StandingData
 * @typedef {{Fixed: boolean, AdditionalColumns:null, TaskInfo: TaskInfo[], StandingsData: StandingData[]}} Standings
 */

/**
 * urlにあるjsonデータを取得する
 * @param url
 * @return {Promise<{}>}
 */
export async function getJsonData(url) {
    return await $.ajax({url: url, dataType: "json"})
}

/**
 *
 * @param contestScreenName
 * @return {Promise<Standings>}
 */
export async function getStandingsData(contestScreenName) {
    return await getJsonData(`https://atcoder.jp/contests/${contestScreenName}/standings/json`);
}

/**
 * コンテストの結果一覧を取得する
 * @param {string} [contestScreenName] コンテスト名
 * @return {Promise<Object.<string, number>>}
 */
export async function getAPerfsData(contestScreenName) {
    return await getJsonData(`https://ac-predictor.azurewebsites.net/api/aperfs/${contestScreenName}`);
}

/**
 * コンテストの結果一覧を取得する
 * @param {string} [contestScreenName] コンテスト名
 * @return {Promise<UserResult[]>}
 */
export async function getResultsData(contestScreenName) {
    return await getJsonData(`https://atcoder.jp/contests/${contestScreenName}/results/json`);
}

/**
 * ユーザーのコンテスト参加履歴を取得する
 * @param {string} [userScreenName] ユーザー名
 * @return {Promise<UserResult[]>}
 */
export async function getHistoryData(userScreenName) {
    return await getJsonData(`https://atcoder.jp/users/${userScreenName}/history/json`);
}


import moment from "moment";
import { userScreenName } from "./global";

/**
 * @type {UserResult[]}
 */
let myHistoryData = null;
/**
 * 自分のパフォーマンス履歴を取得
 * @return {Promise<UserResult[]>} パフォーマンス履歴を返すpromise
 */
export async function getMyHistoryData() {
    return new Promise((resolve) => {
        if (myHistoryData || !userScreenName) resolve(myHistoryData);
        getHistoryData(userScreenName).then((data) => {
            resolve(myHistoryData = data);
        })
    });
}

/**
 * ユーザーのパフォーマンス履歴を時間降順で取得
 * @param {UserResult[]} [history] ユーザーのコンテスト結果履歴
 * @return {number[]}
 */
export function getPerformanceHistories(history) {
    let onlyRated = history.filter(x => x.IsRated);
    onlyRated.sort((a, b) => moment(b.EndTime) - moment(a.EndTime));
    return onlyRated.map(x => x.Performance);
}