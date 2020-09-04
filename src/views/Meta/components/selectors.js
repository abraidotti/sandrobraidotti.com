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
              issues(first: 10, orderBy: { field: CREATED_AT, direction: DESC }) {
                edges {
                  node {
                    number
                    title
                    state
                    url
                    updatedAt
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

export const fetchProject = selector({
  key: 'projectSelector',
  get: async () => {
    const projectData = await graphqlWithAuth(
      `
      {
        repository(owner: "abraidotti", name: "sandrobraidotti.com") {
          id
          project(number: 1) {
            updatedAt
            name
            url
            body
            columns(first: 4) {
              nodes {
                cards {
                  totalCount
                }
                name
              }
            }
          }
        }
      }
        `
    );
    const { project } = projectData.repository
    const totalCards = project.columns.nodes
      .map(node => node.cards.totalCount)
      .reduce((a, b) => a + b, 0);

    return { ...project, totalCards };
  }
});
