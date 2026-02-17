import React, { useCallback, useContext, useEffect } from 'react';
import { postToApi, putToApi } from '../../apis/apis';
import { Store } from 'react-notifications-component';
import RouterLinks from '../../App/RouterLinks';
import { useNavigate } from 'react-router-dom';
import { use } from 'i18next';
import { setUserToStateAction } from '../../contexts/user-context/user.actions';
import { FormContext } from '../../contexts/pages-context/HistoricalPeriodProvider';
import UesrContext from '../../contexts/user-context/UserProvider';
import { message } from 'antd';

type ControllerProps = {
    currentStep: number;
    setCurrentStep: (number: number) => void;
    stepsLength: number;
    nextStep: () => void;
    prevStep: () => void;
    isStepValid: boolean;
    selectedHistoricalPeriod: {},
};

const FormController: React.FC<ControllerProps> = ({ selectedHistoricalPeriod, setCurrentStep, currentStep, stepsLength, nextStep, prevStep, isStepValid }) => {
    const navigate = useNavigate();
    const { isView, isEdit } = React.useContext(FormContext)!;
    const { user } = useContext(UesrContext);

    const saveAndClose = () => {

        handelApiCalling()
    }
    const handleNextStep = useCallback(async () => {
        const images = JSON.parse(localStorage.getItem("Images") as string);
        ////console.log("🚀 ~ handleNextStep ~ images:", images, currentStep, user?.user?.RoleName?.includes("support"))

        if (isStepValid) {
            if (currentStep < stepsLength - 1) {
                if(!user?.user?.RoleName?.includes("Multimedia")) {
                    if (currentStep == 1 && (images == null || images?.length == 0) && user?.user?.RoleName?.includes("Multimedia")) {
                        message.error('يجب اضافه صور');
                    } else {
                        nextStep();
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth',
                        });
                    }
                }else {
                    if (currentStep == 0 && (images == null || images?.length == 0) && user?.user?.RoleName?.includes("Multimedia")) {
                        message.error('يجب اضافه صور');
                    } else {
                        nextStep();
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth',
                        });
                    }
                }
                
            } else {
                handelApiCalling()
            }
        }
    }, [isStepValid, currentStep, stepsLength, nextStep]);

    const handelApiCalling = async () => {

        // Logic for saving the form on the last step
        // alert('Form has been saved successfully!');
        const HistoricalCategoryStep = JSON.parse(localStorage.getItem("HistoricalCategoryStep") as string);
        const HistoricalBasicInfo = JSON.parse(localStorage.getItem("HistoricalBasicInfo") as string);
        const HistoricalSummary = JSON.parse(localStorage.getItem("HistoricalSummary") as string);
        const HistoricalDetails = JSON.parse(localStorage.getItem("HistoricalDetails") as string);
        const HistoricalUnits = JSON.parse(localStorage.getItem("Units") as string);
        const BasicInfo = localStorage.getItem("BasicInfo");
        // ////console.log("🚀 ~ handleNextStep ~ images:", images)
        const HistoricalPeriod = JSON.parse(localStorage.getItem("HistoricalPeriod") as string)?.HistoricalPeriod;
        // ////console.log("🚀 ~ handleNextStep ~ HistoricalPeriod:", HistoricalPeriod);
        const images = JSON.parse(localStorage.getItem("Images") as string);

        const payLoad = {
            //References: HistoricalDetails.References.map((item: any) => item.value),
            Units: HistoricalUnits?.map((item: any, index: any) => {
                return ({
                    "UnitId": item.UnitId ? item.UnitId : 0,
                    // "UnitPhotoPath": item.imgs?.length > 0 ? item.imgs[0]?.url : null,
                    // "ImageBase64": item.imgs.length > 0 ? item.imgs[0].base64 : null,
                    "UnitImagePath": item.imgs?.length > 0 ? item.imgs[0]?.ImageFile : null,

                    "UnitTranslations": [
                        {
                            "UnitTranslationId": item.UnitTranslationId ? item.UnitTranslationId : 0,
                            "LanguageCode": "ar",
                            "UnitId": item.UnitId ? item.UnitId : 0,
                            "UnitTitle": item.UnitTitle,
                            "UnitContent": item.UnitContent,
                            "UnitMoreContent": item.UnitMoreContent,
                            "ImageAltText": item.imgs?.length > 0 ? item.imgs[0]?.alt : null
                        }
                    ],
                    OrderNumber: index + 1,
                    References: item.References.map((item: any) => {
                        return ({
                            "ReferenceId": parseInt(item.ReferenceId),
                            "PageNumber": item.PageNumber
                        })
                    }),
                })
            }),
            HistImages: (images != null && images?.length > 0) ? images.map((item: any) => {
                return ({

                    "ImageId": item.ImageId ? item.ImageId : 0,
                    // "ImageBase64": item.base64,
                    "ImagePath": item.ImageId ? item.base64 : item.ImageFile,
                    "ImageTranslations": [
                        {
                            "ImageTranslationId": item.ImageTranslationId ? item.ImageTranslationId : 0,
                            "LanguageCode": "ar",
                            "ImageId": 0,
                            "ImageAltText": item.alt
                        }
                    ]

                })
            }) : null,
            "HistoricalPeriod": {
                "HistoricalPeriodId": HistoricalPeriod?.HistoricalPeriodId ? HistoricalPeriod?.HistoricalPeriodId : 0,
                "HistoricalPeriodYearFrom": HistoricalCategoryStep.HistoricalPeriodYearFrom,
                "HistoricalPeriodYearTo": HistoricalCategoryStep.HistoricalPeriodYearTo,
                "IsADYearTo": HistoricalCategoryStep.IsADYearTo == '1' ? true : false,
                "IsADYearFrom": HistoricalCategoryStep.IsADYearFrom == '1' ? true : false,
                "HistoricalPeriodEras": HistoricalCategoryStep.EraId.map((Era: any) => {
                    return ({
                        "EraId": Era.value,
                        "HistoricalPeriodId": HistoricalPeriod?.HistoricalPeriodId ? HistoricalPeriod?.HistoricalPeriodId : 0,
                    })
                }
                ), // العصر 1
                "ContentStatusId": 0,
                "CivilizationId": HistoricalCategoryStep.CivilizationId, // الحضاره 1
                "TrustId": parseInt(HistoricalDetails.TrustId),  // الموثوقية *4
                "CreatedById": 0,
                "ModeratorNotes": HistoricalDetails.ModeratorNotes, // ملاحظات المشرف4 
                "HistoricalPeriodRegions": HistoricalCategoryStep.RegionIds.map((regionId: any) => ({
                    "RegionId": regionId.value,
                    "HistoricalPeriodId": HistoricalPeriod?.HistoricalPeriodId ? HistoricalPeriod?.HistoricalPeriodId : 0,
                })),
                "HistoricalPeriodTranslations": [
                    {
                        "HistoricalPeriodTranslationId": HistoricalPeriod?.HistoricalPeriodTranslations[0].HistoricalPeriodTranslationId ? HistoricalPeriod.HistoricalPeriodTranslations[0].HistoricalPeriodTranslationId : 0,
                        "LanguageCode": "ar",
                        "HistoricalPeriodId": HistoricalPeriod?.HistoricalPeriodId ? HistoricalPeriod?.HistoricalPeriodId : 0,
                        "HistoricalPeriodName": HistoricalBasicInfo.name, // الاسم 2
                        "BasicInfo": BasicInfo, // المعلومات الأساسية 2
                        "HistoricalPeriodSummary": HistoricalSummary.HistoricalPeriodSummary // الملخص 3
                    }
                ]
            },
        }
        // ////console.log("🚀 payload :", payLoad);
        let res;
        let message = "تمت الاضافة بنجاح"
        if (localStorage.getItem("HistoricalPeriod")) {
            payLoad.HistoricalPeriod.IsUpdated = true
            res = await postToApi(`HistoricalPeriod/update-HistoricalPeriod-FullObject`, payLoad);
            message = "تم التعديل بنجاح"
        } else {
            res = await postToApi(`HistoricalPeriod/add-HistoricalPeriod-FullObject`, payLoad);
        }
        // ////console.log("🚀 ~ handleNextStep ~ res:", res)
        if (res) {
            localStorage.removeItem("HistoricalCategoryStep");
            localStorage.removeItem("HistoricalBasicInfo");
            localStorage.removeItem("HistoricalSummary");
            localStorage.removeItem("HistoricalDetails");
            localStorage.removeItem("Units");
            localStorage.removeItem("Images");
            localStorage.removeItem("images");

            localStorage.removeItem("BasicInfo");
            localStorage.removeItem("HistoricalPeriod");

            localStorage.removeItem("imgs");
            // localStorage.clear();
            setCurrentStep(0);
            navigate(RouterLinks.historicalPeriodPage)
            Store.addNotification({
                title: "",
                message: message,
                type: "success",
                insert: "top",
                container: "top-right",
                animationIn: ["animate__animated", "animate__fadeIn"],
                animationOut: ["animate__animated", "animate__fadeOut"],
                dismiss: {
                    duration: 2000,
                    onScreen: true,
                },
            });

        } else {
            // alert('An error occurred while saving the form.');
            Store.addNotification({
                title: "",
                message: "حدث خطأ اثناء الاضافه",
                type: "danger",
                insert: "top",
                container: "top-right",
                animationIn: ["animate__animated", "animate__fadeIn"],
                animationOut: ["animate__animated", "animate__fadeOut"],
                dismiss: {
                    duration: 2000,
                    onScreen: true,
                },
            });
        }

    }
    const handlePrevStep = useCallback(() => {
        if (currentStep > 0) {
            prevStep();
        }
    }, [currentStep, prevStep]);

    useEffect(() => {
        localStorage.removeItem("HistoricalCategoryStep");
        localStorage.removeItem("HistoricalBasicInfo");
        localStorage.removeItem("HistoricalSummary");
        localStorage.removeItem("HistoricalDetails");
        localStorage.removeItem("Units");
        localStorage.removeItem("images");
        localStorage.removeItem("Images");
        // localStorage.removeItem("HistoricalPeriod");

        localStorage.removeItem("BasicInfo");
        localStorage.removeItem("imgs");
        // localStorage.clear()
    }, []);
    return (
        <div style={{ padding: '15px', display: 'flex', textAlign: 'right', paddingRight: '100px', borderTop: '2px solid #D1D1D1' }}>
            {!isView && !isEdit ? (
                <button
                    onClick={handleNextStep}
                    disabled={!isStepValid}

                    style={{
                        backgroundColor: currentStep === stepsLength - 1 ? '#048D3D' : '#048D3D',
                        color: 'white',
                        borderRadius: '8px',
                        padding: '0.6rem 1rem',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >

                    {currentStep === stepsLength - 1 ? 'حفظ' : 'الخطوة التالية'}
                    {currentStep !== stepsLength - 1 && (
                        <svg className='mx-2' width="12" height="20" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g opacity="0.65">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M5.78033 15.2803C5.48744 15.5732 5.01256 15.5732 4.71967 15.2803L0.21967 10.7803C-0.0732234 10.4874 -0.0732234 10.0126 0.21967 9.71967L4.71967 5.21967C5.01256 4.92678 5.48744 4.92678 5.78033 5.21967C6.07322 5.51256 6.07322 5.98744 5.78033 6.28033L2.56066 9.5H11.25C11.6642 9.5 12 9.83579 12 10.25C12 10.6642 11.6642 11 11.25 11L2.56066 11L5.78033 14.2197C6.07322 14.5126 6.07322 14.9874 5.78033 15.2803Z"
                                    fill="white"
                                />
                            </g>
                        </svg>
                    )}
                </button>
            ) : <></>}
            {isEdit ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                    {currentStep === stepsLength - 1 ?
                        <></> : <button
                            onClick={handleNextStep}
                            disabled={!isStepValid}

                            style={{
                                backgroundColor: currentStep === stepsLength - 1 ? '#048D3D' : '#048D3D',
                                color: 'white',
                                borderRadius: '8px',
                                padding: '0.6rem 1rem',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            {currentStep === stepsLength - 1 ? 'حفظ' : 'حفظ واستمرار'}
                            {currentStep !== stepsLength - 1 && (
                                <svg className='mx-2' width="12" height="20" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g opacity="0.65">
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M5.78033 15.2803C5.48744 15.5732 5.01256 15.5732 4.71967 15.2803L0.21967 10.7803C-0.0732234 10.4874 -0.0732234 10.0126 0.21967 9.71967L4.71967 5.21967C5.01256 4.92678 5.48744 4.92678 5.78033 5.21967C6.07322 5.51256 6.07322 5.98744 5.78033 6.28033L2.56066 9.5H11.25C11.6642 9.5 12 9.83579 12 10.25C12 10.6642 11.6642 11 11.25 11L2.56066 11L5.78033 14.2197C6.07322 14.5126 6.07322 14.9874 5.78033 15.2803Z"
                                            fill="white"
                                        />
                                    </g>
                                </svg>
                            )}
                        </button>
                    }                    <button
                        onClick={saveAndClose}
                        disabled={!isStepValid}

                        style={{
                            backgroundColor: currentStep === stepsLength - 1 ? '#048D3D' : '#048D3D',
                            color: 'white',
                            borderRadius: '8px',
                            padding: '0.6rem 1rem',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        حفظ وانهاء
                    </button>
                </div>
            ) : <></>}
            {isView && currentStep !== stepsLength - 1 ? (
                <button
                    onClick={handleNextStep}
                    disabled={!isStepValid}

                    style={{
                        backgroundColor: currentStep === stepsLength - 1 ? '#048D3D' : '#048D3D',
                        color: 'white',
                        borderRadius: '8px',
                        padding: '0.6rem 1rem',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    {currentStep === stepsLength - 1 ? 'حفظ' : 'الخطوة التالية'}
                    {currentStep !== stepsLength - 1 && (
                        <svg className='mx-2' width="12" height="20" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g opacity="0.65">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M5.78033 15.2803C5.48744 15.5732 5.01256 15.5732 4.71967 15.2803L0.21967 10.7803C-0.0732234 10.4874 -0.0732234 10.0126 0.21967 9.71967L4.71967 5.21967C5.01256 4.92678 5.48744 4.92678 5.78033 5.21967C6.07322 5.51256 6.07322 5.98744 5.78033 6.28033L2.56066 9.5H11.25C11.6642 9.5 12 9.83579 12 10.25C12 10.6642 11.6642 11 11.25 11L2.56066 11L5.78033 14.2197C6.07322 14.5126 6.07322 14.9874 5.78033 15.2803Z"
                                    fill="white"
                                />
                            </g>
                        </svg>
                    )}
                </button>
            ) : <></>}
            <button
                onClick={() => {
                    // localStorage.clear();
                    navigate(RouterLinks.historicalPeriodPage)
                }}
                // disabled={currentStep === 0}
                style={{
                    backgroundColor: 'transparent',
                    color: '#060606',
                    borderRadius: '8px',
                    padding: '0.6rem 2rem',
                    border: '1px solid #000000',
                    marginRight: '10px',
                    cursor: 'pointer',
                }}
            >
                إلغاء
            </button>
        </div>
    );
};

export default FormController;
