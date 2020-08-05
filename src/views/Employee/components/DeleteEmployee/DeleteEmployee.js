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
  }
}));

const DeleteEmployee = props => {
  const { className, ...rest } = props;

  const classes = useStyles();

  const [values, setValues] = useState({
    uid: '',
    department: '',
    isDeleted: false
  });

  const options = {
    headers: {
      'x-api-key': process.env.REACT_APP_EMPLOYEE_API_KEY
    },
  };
  
  const body = { 
    uid: values.uid,
    department: values.department,
  }

  const { del, response, loading, error } = useFetch(
    process.env.REACT_APP_EMPLOYEE_API_URL,
    options
  );

  const handleChange = event => {
    setValues({
      ...values,
      isDeleted: false,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    await del('/employee', body);
    if (response.ok) {
      setValues({
        uid: '',
        department: '',
        isDeleted: true
      });
    }
  };

  return (
    <Card 
      {...rest} 
      className={clsx(classes.root, className)}
    >
      <form onSubmit={handleSubmit}>
        <CardHeader
          subheader="src/views/Employee/components/DeleteEmployee/DeleteEmployee.js"
          title="Delete Employee"
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
        <CardActions>
          <Grid
            container
            justify="space-between"
          >
            <Grid item>
              <Button
                color="primary"
                type="submit"
                variant="outlined"
              >
                delete
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
              {values.isDeleted &&
                <CheckCircleIcon
                  className={classes.icon}
                  color="secondary"
                />}
            </Grid>
          </Grid>
        </CardActions>
      </form>
    </Card>
  );
};

DeleteEmployee.propTypes = {
  className: PropTypes.string
};

export default DeleteEmployee;
