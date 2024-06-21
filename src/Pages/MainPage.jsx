import React, { useRef, useState } from 'react'
import { IoMdSearch } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { baseUrl } from "../baseUrl";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const MainPage = () => {

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [error, setError] = useState('');

    const createExcelFile = (data, fileName) => {
        const worksheet = XLSX.utils.json_to_sheet(data);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(excelBlob, `${fileName}.xlsx`);
    };



  const handleSubmit = async () => {
    setLoading(true);
    setMessage('Scraping URL...');
    setError('');

    try{
        const response1 = await axios.post(`${baseUrl}/`, {
            url
        });
        if(response1.status === 200){
            setRestaurant(response1.data.restaurantName);
            setMessage('Scraping successful!');
            if(response1.data.urls?.length === 0){
                setError('Menu not found!')
                return;
            }
            console.log(response1.data);

            setTimeout(() => {
                setMessage('Preparing Menu...');
            }, 1000);

            const response2 = await axios.post(`${baseUrl}/getFinalMenu`, {
                imageUrls: response1.data.urls,
                restaurantName: response1.data.restaurantName
            });
            if(response2.status === 200){
                setTimeout(() => {
                    setMessage('Prepared!');
                }, 1000);
                createExcelFile(response2.data.finalRes, 'menu_data');
                setMessage('Downloaded!');
            }else{
                setError('Failed to generate Menu')
                throw new Error(`Failed in GPT Response`)
            }
        }else{
            setError('Failed to scrape menu');
            throw new Error(`Failed to Scrape data`)
        }
    }catch(e){
        setError('Something went wrong!');
        console.log(e.message);
    }finally{
        setLoading(false);
    }
};

 
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && selectedFiles.length !== 0) {
        handleSubmit();
    }
  };

  return (
    <div className='w-full h-screen flex justify-center items-center p-16 bg-[#024950]' >
        <div className="w-4/5 flex justify-center gap-6 items-center flex-col">
        <div className="flex flex-col gap-2 w-full justify-center items-center">
            <h2 className="text-5xl text-white font-bold">
                Drop the URL
            </h2>
            <h3 className="text-xl text-[#cdcdcd]">
                We will scrape restaurant menu from the Restaurant URL
            </h3>
        </div>
        <div className="flex gap-2 w-full justify-center items-center">
            <div className="w-[56%] p-2 flex justify-start items-center gap-2 rounded-md bg-white">
                <IoMdSearch size={'1.5rem'} color='gray' />
                <input type="text" className='w-full bg-transparent text-base text-gray-500 font-bold outline-none' placeholder='Enter the URL here...' value={url} onChange={(e)=>setUrl(e.target.value)} required onKeyDown={handleKeyDown} />
            </div>
        </div>

        <div className="flex gap-2 flex-col w-full justify-center items-center">
            <button className='w-1/4 py-3 text-lg flex gap-2 justify-center items-center font-bold shadow-md rounded-lg text-white bg-[#003135] transform transition-transform hover:scale-105 active:scale-95' onClick={handleSubmit}>
                {
                    loading ? 
                    <>
                    <div className="loader"></div>
                    <p className='text-white'>
                        {message}
                    </p>
                    </>
                    : 
                    "Search"
                }
            </button>
            {
                error ?
                <p className='font-bold h-8 text-base text-red-700'>{error} </p>
                :
                restaurant ?
                <p className='font-bold h-8 text-base text-white'> Fetching for {restaurant} </p>
                : 
                <></>
            }
        </div>
        </div>
    </div>
  )
}

