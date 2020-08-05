import React, { useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography as MuiTypography
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import useFetch from 'use-http';

const useStyles = makeStyles(theme => ({
  root: {
    '& .MuiTextField-root': {
      margin: theme.spacing(2),
      width: 230
    }
  },
  icon: {
    height: 28,
    width: 28,
    marginTop: 4
  },
  tableFooter: {
    marginLeft: 20
  }
}));

const GetEmployee = props => {
  const { className, ...rest } = props;

  const classes = useStyles();

  const [values, setValues] = useState({
    uid: '',
    department: '',
    info: null,
    isRetrieved: false
  });

  const options = {
    headers: {
      'x-api-key': process.env.REACT_APP_EMPLOYEE_API_KEY
    }
  };

  const { get, response, loading, error } = useFetch(
    process.env.REACT_APP_EMPLOYEE_API_URL,
    options
  );

  const handleChange = event => {
    setValues({
      ...values,
      info: null,
      isRetrieved: false,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const result = await get(
      `/employee/${values.uid}/department/${values.department}`
    );
    if (response.ok) {
      if (result.Count === 0) {
        setValues({ ...values, info: null, isRetrieved: true });
      }
      if (result.Count === 1) {
        setValues({
          ...values,
          info: { ...result.Items[0].info },
          isRetrieved: true
        });
      }
    }
  };

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <form onSubmit={handleSubmit}>
        <CardHeader
          subheader="src/views/Employee/components/GetEmployee/GetEmployee.js"
          title="Get Employee"
        />
        <Divider />
        <CardContent>
          <TextField
            fullWidth
            helperText="Sort key"
            label="uid"
            name="uid"
            onChange={handleChange}
            required
            size="small"
            type="text"
            value={values.uid}
            variant="outlined"
          />
          <TextField
            fullWidth
            helperText="Partition key"
            label="department"
            name="department"
            onChange={handleChange}
            required
            size="small"
            type="text"
            value={values.department}
            variant="outlined"
          />
          {values.isRetrieved && values.info && (
            <div>
              <TableContainer component={Paper}>
                <Table
                  aria-label="simple table"
                  className={classes.table}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Key</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(values.info).map((key, index) => {
                      return (
                        <TableRow key={`rowKey-${index}`}>
                          <TableCell
                            component="th"
                            key={`cellKey-${index}`}
                            scope="row"
                          >
                            {key}
                          </TableCell>
                          <TableCell align="right">
                            {values.info[key]}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <MuiTypography
                className={classes.tableFooter}
                variant="caption"
              >
                Recently updated records may be cached.
              </MuiTypography>
            </div>
          )}
        </CardContent>
        <Divider />
        <CardActions>
          <Grid
            container
            justify="space-between"
          >
            <Grid item>
              <Button
                color="primary"
                type="submit"
                variant="contained"
              >
                get
              </Button>
            </Grid>
            <Grid item>
              {error && 
                <ErrorIcon
                  className={classes.icon}
                  color="error"
                />}
              {loading && 
                <CircularProgress
                  color="secondary"
                  size={30}
                />}
              {values.isRetrieved && !values.info && (
                <CancelIcon
                  className={classes.icon}
                  color="secondary"
                />
              )}
              {values.isRetrieved && values.info && (
                <CheckCircleIcon
                  className={classes.icon}
                  color="secondary"
                />
              )}
            </Grid>
          </Grid>
        </CardActions>
      </form>
    </Card>
  );
};

GetEmployee.propTypes = {
  className: PropTypes.string
};

export default GetEmployee;
