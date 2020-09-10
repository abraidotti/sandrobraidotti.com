/* eslint-disable react/no-multi-comp */
import React from 'react';
import { useRecoilValue } from 'recoil';
import { fetchProject } from '../selectors';
import { Doughnut } from 'react-chartjs-2';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { makeStyles, useTheme } from '@material-ui/styles';
import {
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Divider,
  Typography
} from '@material-ui/core';
import DoneIcon from '@material-ui/icons/Done';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import EmojiObjectsIcon from '@material-ui/icons/EmojiObjects';
import ForwardIcon from '@material-ui/icons/Forward';
import LinkIcon from '@material-ui/icons/Link';

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%'
  },
  chartContainer: {
    position: 'relative',
    height: '300px'
  },
  stats: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between'
  },
  section: {
    textAlign: 'center'
  },
  sectionIcon: {
    color: theme.palette.icon
  }
}));

const IssueCounter = props => {
  const { className, ...rest } = props;

  const classes = useStyles();
  const theme = useTheme();

  const options = {
    legend: {
      display: false
    },
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    cutoutPercentage: 80,
    layout: { padding: 0 },
    tooltips: {
      enabled: true,
      mode: 'index',
      intersect: false,
      borderWidth: 1,
      borderColor: theme.palette.divider,
      backgroundColor: theme.palette.white,
      titleFontColor: theme.palette.text.primary,
      bodyFontColor: theme.palette.text.secondary,
      footerFontColor: theme.palette.text.secondary
    }
  };

  const Project = () => {
    const project = useRecoilValue(fetchProject);

    const data = {
      datasets: [
        {
          data: project.columns.nodes.map(node => node.cards.totalCount),
          backgroundColor: [
            theme.palette.primary.main,
            theme.palette.error.main,
            theme.palette.warning.main,
            theme.palette.text.secondary
          ],
          borderWidth: 8,
          borderColor: theme.palette.white,
          hoverBorderColor: theme.palette.white
        }
      ],
      labels: project.columns.nodes.map(node => node.name)
    };

    const iconNames = [
      <EmojiObjectsIcon />,
      <ForwardIcon />,
      <DoubleArrowIcon />,
      <DoneIcon />
    ];

    const iconColors = [
      theme.palette.primary.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.text.secondary
    ];

    const sections = project.columns.nodes.map((node, index) => {
      return {
        title: node.name,
        value: node.cards.totalCount,
        icon: iconNames[index],
        color: iconColors[index]
      };
    });

    return (
      <Card
        {...rest}
        className={clsx(classes.root, className)}
      >
        <CardHeader
          action={
            <IconButton
              component="a"
              href={project.url}
              size="small"
              target="_blank"
            >
              <LinkIcon />
            </IconButton>
          }
          title={`${project.name} - ${project.totalCards} cards`}
        />
        <Divider />
        <CardContent>
          <div className={classes.chartContainer}>
            <Doughnut
              data={data}
              options={options}
            />
          </div>
          <div className={classes.stats}>
            {sections.map(section => (
              <div
                className={classes.section}
                key={section.title}
              >
                <span className={classes.sectionIcon}>{section.icon}</span>
                <Typography variant="body1">{section.title}</Typography>
                <Typography
                  style={{ color: section.color }}
                  variant="h2"
                >
                  {section.value}
                </Typography>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Project />
    </React.Suspense>
  );
};

IssueCounter.propTypes = {
  className: PropTypes.string
};

export default IssueCounter;
