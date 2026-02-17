import React, { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { UserOutlined, LoginOutlined, LockOutlined } from '@ant-design/icons';
import AntdTextField from '../../common/antd-form-components/AntdTextField';
import { Button, Form } from 'antd';
import AntdCheckbox from '../../common/antd-form-components/AntdCheckbox';
import { useTranslation } from 'react-i18next';
import { store } from 'react-notifications-component';
import Logo from '../../common/logo/Logo';
import './LoginForm.scss';
import UesrContext from '../../contexts/user-context/UserProvider';
import { postToApi } from '../../apis/apis';
import { useNavigate } from 'react-router-dom';
import RouterLinks from '../../App/RouterLinks';

const schema = Yup.object().shape({
  Username: Yup.string().required('ادخل اسم المستخدم'),
  Password: Yup.string().required('ادخل كلمه السر')
});

const LoginForm = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const { setCurrentUser, setUserToState } = useContext(UesrContext);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'all',
    defaultValues: {
      Username: '',
      Password: '',
      remember: true
    }
  });
  const onSubmit = async (data) => {
    try {
      const res = await postToApi("Authentication/login", data);
      // console.log('res: ', res);
      if (Object.keys(res).length === 0) {
        store.addNotification({
          title: 'error',
          message: res?.data?.message || 'wrong data',
          type: 'danger',
          insert: 'top',
          container: 'top-right',
          animationIn: ['animate__animated', 'animate__fadeIn'],
          animationOut: ['animate__animated', 'animate__fadeOut'],
          dismiss: {
            duration: 2000,
            showIcon: true,
            onScreen: true
          }
        });
      } else if (Object.keys(res).length !== 0) {
        // if (data.remember) setCurrentUser({ ...res });
        // else {
        if (res.user.RoleName === "فنى") {
          navigate(RouterLinks.techOrders);
          setUserToState({ ...res });
          location.reload();
        } else {
          setUserToState({ ...res });
          location.reload();
        }
        // }
      }
    } catch (error) {
      // //console.log(error);
    }
  };

  const [form] = Form.useForm();
  return (
    <Form className="login-form" form={form} layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Logo className="form-logo" />
      <div className="form-header">
        <p> تسجيل الدخول</p>
      </div>

      <div className="form-body">
        <AntdTextField
          name="Username"
          type="text"
          placeholder={'اسم المستخدم...'}
          // label="الاســــم"
          errorMsg={errors?.Username?.message}
          validateStatus={errors?.Username ? 'error' : ''}
          prefix={<UserOutlined />}
          control={control}
        />
        <AntdTextField
          name="Password"
          type="password"
          placeholder={'الرقم السري...'}
          // label="الرقــم الســرى"
          errorMsg={errors?.Password?.message}
          validateStatus={errors?.Password ? 'error' : ''}
          prefix={<LockOutlined />}
          control={control}
        />

        <AntdCheckbox name="remember" label="تذكرني" control={control} />
        <Button
          className="submit-btn"
          htmlType="submit"
          type="primary"
          icon={<LoginOutlined />}
          loading={isSubmitting}>
          تسجيل الدحول
        </Button>
      </div>
    </Form>
  );
};

export default LoginForm;