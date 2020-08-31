import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { issues as issuesAtom } from '../atoms';
import { graphql } from '@octokit/graphql';

import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles({
  root: {
    minWidth: 275
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)'
  },
  title: {
    fontSize: 14
  },
  pos: {
    marginBottom: 12
  }
});

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.REACT_APP_GITHUB_PERSONAL_TOKEN}`
  }
});

const Issues = () => {
  const classes = useStyles();

  const [issues, setIssues] = useRecoilState(issuesAtom);

  useEffect(() => {
    const getIssues = async () => {
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
      const { edges } = issuesData.repository.issues
      console.log(edges);
      setIssues(edges);
    };

    getIssues();
    console.log(issues);
  }, []);

  return <p>test</p>;
};

export default Issues;
