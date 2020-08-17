import React from 'react';
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

const Policy = () => {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography
          className={classes.title}
          color="textSecondary"
          gutterBottom
        >
          Privacy Policy
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          Introduction
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          I your privacy seriously. To better protect your privacy I provide
          this privacy policy notice explaining the way your personal
          information is collected and used.
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          Collection of Routine Information
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          This website tracks basic information about its users. This
          information includes, but is not limited to, IP addresses, browser
          details, timestamps and referring pages. None of this information can
          personally identify specific users to this website. The information is
          tracked for routine administration and maintenance purposes.
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          Cookies
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          Where necessary, this website uses cookies to store information about
          a visitor’s preferences and history in order to better serve the user
          and/or present the user with customized content.{' '}
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          Advertisement and Other Third Parties
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          Advertising partners and other third parties may use cookies, scripts
          and/or web beacons to track users' activities on this website in order
          to display advertisements and other useful information. Such tracking
          is done directly by the third parties through their own servers and is
          subject to their own privacy policies. This website has no access or
          control over these cookies, scripts and/or web beacons that may be
          used by third parties.{' '}
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          Links to Third Party Websites
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          I have included links on this website for your use and reference. I am
          not responsible for the privacy policies on these websites. You should
          be aware that the privacy policies of these websites may differ from
          my own.
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          Security
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          The security of your personal information is important to me, but
          remember that no method of transmission over the Internet, or method
          of electronic storage, is 100% secure. While I strive to use
          commercially acceptable means to protect your personal information, I
          cannot guarantee its absolute security.
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          Changes To This Privacy Policy
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          This Privacy Policy is effective as of August 15th, 2020 and will
          remain in effect except with respect to any changes in its provisions
          in the future, which will be in effect immediately after being posted
          on this page. I reserve the right to update or change my Privacy
          Policy at any time and you should check this Privacy Policy
          periodically. If I make any material changes to this Privacy Policy, I
          will notify you either through the email address you have provided me,
          or by placing a prominent notice on my website.
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          Contact Information
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          For any questions or concerns regarding the privacy policy, please
          send me an <a href="mailto:alessandro.braidotti@gmail.com">email</a>.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default Policy;
