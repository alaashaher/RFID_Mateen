
import "./HomePage.scss";
import PieChart from "./PieChart";
import React, { useContext, useEffect, useState } from 'react'
import { getFromApi, putToApi } from '../../apis/apis';

import { Button, Form, Input, Checkbox, Select, Table } from "antd";
import { Store } from 'react-notifications-component';
import { Controller } from 'react-hook-form';
import { PrinterFilled, PrinterOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import RouterLinks from "../../App/RouterLinks";

const HomePage = () => {
  const [totalData, settotalData] = useState([])
  const navigate = useNavigate();
  useEffect(() => {
    const getAllData = async () => {
      try {
        const resp = await getFromApi(
          `UniversityAsset/get-assets-needs-print`
        );
        settotalData(resp);
      } catch (error) {
        //console.log(error);
      }
    };
    getAllData();
  }, []);
  const [form] = Form.useForm();
  const onFinish = async (values: any) => {
    // console.log("🚀 ~ onFinish ~ values:", values)
    let payload;
  }
  return (
    <div className="" >

      {/* <div className="home-statistics">
        <div className="statistics-ul">
          <div className="li">
            <div className="img-wrap">
              <PrinterFilled />
            </div>
            <div className="s-text">
              <span>{totalData.RowCount}</span>
              <span>الاصول التي تم تعرفيها حديثا ولو يتم طباعتها</span>
            </div>
            <div className="btn-view">

              <Button className='button-style' type="primary" onClick={() => {
                navigate(RouterLinks.UniversityAssetsPrinted)
              }} disabled={totalData.RowCount == 0}>عرض الاصول</Button>
            </div>

          </div>
          <div className="li">
            <Form
              name="basic"
              //style={{ width: 750, direction: 'rtl' }}
              onFinish={onFinish}
              autoComplete="off"
              form={form}
              labelAlign="right"
            >
              <div className="form-divNew">

                <Form.Item style={{ marginRight: '-5px' }}
                  label="التاريخ"
                  name="dateFrom"
                >
                  <Input
                    onChange={(value) => { form.setFieldsValue({ dateFrom: value.target.value }) }}
                    placeholder={" التاريخ من"}
                    size="large"
                    type='date'
                  />
                </Form.Item>
                <Form.Item style={{ marginRight: '10px', marginLeft: '-5px' }}
                  label={" التاريخ الي"}
                  name="dateTo"
                >
                  <Input
                    onChange={(value) => { form.setFieldsValue({ dateTo: value.target.value }) }}
                    placeholder={" التاريخ الي"}
                    size="large"
                    type='date'
                  />
                </Form.Item>
                <Form.Item>
                  <div >
                    
                    <Button className='button-style' type="primary">بحث</Button>
                  </div>
                </Form.Item>
              </div>
            </Form>
            <div className="img-wrap">
              <PrinterOutlined />
            </div>
            <div className="s-text">
              <span>-</span>
              <span>الاصول التي تم طباعتها ف خلال فتره معينه</span>

            </div>
            <div className="btn-view">

              <Button className='button-style' type="primary" onClick={() => {
                navigate(RouterLinks.homePage)
              }}  disabled>عرض الاصول</Button>
            </div>
          </div>
          <div className="li" style={{ width: "fit-content" }}>
            <PieChart />
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default HomePage;
