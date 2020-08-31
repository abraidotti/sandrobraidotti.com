import { selector } from 'recoil';
import { graphql } from '@octokit/graphql';

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.REACT_APP_GITHUB_PERSONAL_TOKEN}`
  }
});

export const fetchIssues = selector({
  key: 'issuesSelector',
  get: async () => {
    const issuesData = await graphqlWithAuth(
      `
          {
            repository(owner: "abraidotti", name: "sandrobraidotti.com") {
              id
              issues(first: 10, states: OPEN) {
                edges {
                  node {
                    number
                    title
                    url
                  }
                }
              }
            }
          }
        `
    );
    const { edges } = issuesData.repository.issues;
    return edges;
  }
});
