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
  TextField
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import useFetch from 'use-http';

const useStyles = makeStyles((theme) => ({
  root: {'& .MuiTextField-root': {
    margin: theme.spacing(2),
    width: 230,}
  },
  icon: {
    height: 28,
    width: 28,
    marginTop: 4
  },
}));

const UpdateEmployee = props => {
  const { className, ...rest } = props;

  const classes = useStyles();

  const [values, setValues] = useState({
    uid: '',
    department: '',
    info: null,
    isRetrieved: false
  });

  const [info, setInfo] = useState({
    infoKey: '',
    infoValue: '',
    isUpdated: false
  })

  const options = {
    headers: {
      'x-api-key': process.env.REACT_APP_EMPLOYEE_API_KEY
    }
  };

  const body = {
    uid: values.uid,
    department: values.department,
    info: { [info.infoKey]: info.infoValue }
  };

  const { get, put, response, loading, error } = useFetch(
    process.env.REACT_APP_EMPLOYEE_API_URL,
    options
  );

  const handleChange = event => {
    setValues({
      ...values,
      info: null,
      isRetrieved: false,
      isUpdated: false,
      [event.target.name]: event.target.value
    });
  };

  const handleChangeInfo = event => {
    setInfo({
      ...info,
      isUpdated: false,
      [event.target.name]: event.target.value
    });
  };

  const handleRetrieve = async event => {
    event.preventDefault()
    const request = await get(`/employee/${values.uid}/department/${values.department}`)
    if (response.ok) {
      if (request.Count === 0) {
        setValues({ ...values, info: null, isRetrieved: true });
      }
      if (request.Count === 1) {
        setValues({ ...values, info: { ...request.Items[0].info }, isRetrieved: true })
        setInfo({
          infoKey: Object.keys(request.Items[0].info)[0],
          infoValue: Object.values(request.Items[0].info)[0],
        })
      }
    }
  };

  const handleUpdate = async event => {
    event.preventDefault();
    await put('/employee', body);
    if (response.ok) {
      setInfo({
        infoKey: '',
        infoValue: '',
        isUpdated: true
      });
    }
  };

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <form onSubmit={handleRetrieve}>
        <CardHeader
          subheader="src/views/Employee/components/UpdateEmployee/UpdateEmployee.js"
          title="Update Employee"
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
              {!values.isRetrieved &&
              loading && 
                <CircularProgress
                  color="secondary"
                  size={30}
                />}
              {values.isRetrieved && 
                !values.info &&
                <CancelIcon
                  className={classes.icon}
                  color="secondary"
                />}
              {values.isRetrieved && 
              values.info && 
                <CheckCircleIcon
                  className={classes.icon}
                  color="secondary"
                />}
            </Grid>
          </Grid>
        </CardActions>
      </form>
      {values.isRetrieved &&
      values.info &&
      <form onSubmit={handleUpdate}>
        <CardContent>
          <TextField
            fullWidth
            helperText="New Info"
            label="Key"
            name="infoKey"
            onChange={handleChangeInfo}
            required
            size="small"
            type="text"
            value={info.infoKey}
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Value"
            name="infoValue"
            onChange={handleChangeInfo}
            required
            size="small"
            type="text"
            value={info.infoValue}
            variant="outlined"
          />
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
                update
              </Button>
            </Grid>
            <Grid item>
              {error && 
                <ErrorIcon
                  className={classes.icon}
                  color="secondary"
                />}
              {loading && 
                <CircularProgress
                  color="secondary"
                  size={30}
                />}
              {info.isUpdated && 
                <CheckCircleIcon
                  className={classes.icon}
                  color="secondary"
                />}
            </Grid>
          </Grid>
        </CardActions>
      </form>
      }
    </Card>
  );
};

UpdateEmployee.propTypes = {
  className: PropTypes.string
};

export default UpdateEmployee;
