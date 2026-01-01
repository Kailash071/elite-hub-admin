import {Setting, type ISetting} from '../models/Setting';


export const getSetting = async ()=>{
    return await Setting.findOne().lean();
}

export const updateSetting = async (updateData: Partial<ISetting>)=>{
    return await Setting.findOneAndUpdate({}, updateData, {new:true, runValidators:true});
}

export const createSetting = async (settingData: Partial<ISetting>)=>{
    return await Setting.create(settingData);
}