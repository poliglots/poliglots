const { execSync } = require("child_process");
const { REPO_ROOT } = require("./config");

function ghApi(endpoint, flags = "") {
  const cmd = `gh api "${endpoint}" ${flags}`.trim();
  try {
    return execSync(cmd, {
      encoding: "utf8",
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    console.error(`❌ gh api error: ${error.stderr || error.message}`);
    throw error;
  }
}

function ghApiJson(endpoint, flags = "") {
  // REST API wrapper that auto-parses JSON response
  const cmd = `gh api "${endpoint}" ${flags}`.trim();
  try {
    const output = execSync(cmd, {
      encoding: "utf8",
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(output);
  } catch (error) {
    console.error(`❌ gh api error: ${error.stderr || error.message}`);
    throw error;
  }
}

function gqlFetch(query, variables) {
  const fields = Object.entries(variables)
    .map(([key, value]) => `--field ${key}="${value}"`)
    .join(" ");
  const cmd = `gh api graphql -f query='${query.trim()}' ${fields}`;
  try {
    const output = execSync(cmd, {
      encoding: "utf8",
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(output);
  } catch (error) {
    console.error(`❌ gh api graphql error: ${error.stderr || error.message}`);
    throw error;
  }
}

// Reusable GraphQL queries
const QUERIES = {
  CONTRIBUTIONS: `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalIssueContributions
        }
        repositoriesContributedTo(
          first: 100
          contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]
        ) {
          totalCount
          nodes {
            nameWithOwner
            stargazerCount
            forkCount
            primaryLanguage { name }
          }
        }
      }
    }`,

  OPEN_PRS: `
    query($login: String!) {
      user(login: $login) {
        pullRequests(first: 1, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}) { totalCount }
      }
    }`,

  MERGED_PRS: `
    query($login: String!) {
      user(login: $login) {
        pullRequests(first: 1, states: MERGED, orderBy: {field: UPDATED_AT, direction: DESC}) { totalCount }
      }
    }`,

  MERGED_PRS_LIST: `
    query($login: String!) {
      user(login: $login) {
        pullRequests(first: 30, states: MERGED, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            title
            number
            repository {
              nameWithOwner
            }
            body
            mergedAt
          }
        }
      }
    }`,
};

module.exports = { ghApi, gqlFetch, QUERIES, ghApiJson };
