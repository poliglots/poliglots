const { gqlFetch, QUERIES } = require("./github-api");

// Single shared cache — populated once per run
let _cache = null;

function ensureCache(username) {
  if (_cache) return _cache;

  console.log("  -> Fetching shared GitHub data...");

  const contribRes = gqlFetch(QUERIES.CONTRIBUTIONS, { login: username });
  const openRes = gqlFetch(QUERIES.OPEN_PRS, { login: username });
  const mergedRes = gqlFetch(QUERIES.MERGED_PRS, { login: username });

  if (contribRes.errors || openRes.errors || mergedRes.errors) return null;

  _cache = {
    coll: contribRes?.data?.user?.contributionsCollection || {},
    repos: contribRes?.data?.user?.repositoriesContributedTo || {},
    openPRs: openRes?.data?.user?.pullRequests?.totalCount ?? 0,
    mergedPRs: mergedRes?.data?.user?.pullRequests?.totalCount ?? 0,
  };

  return _cache;
}

function clearCache() {
  _cache = null;
}

function getColl() {
  return _cache?.coll || {};
}

function getRepos() {
  return _cache?.repos || { totalCount: 0, nodes: [] };
}

function getOpenPRs() {
  return _cache?.openPRs ?? 0;
}

function getMergedPRs() {
  return _cache?.mergedPRs ?? 0;
}

module.exports = { ensureCache, clearCache, getColl, getRepos, getOpenPRs, getMergedPRs };
