import React, { useState } from 'react';
import axios from 'axios';


const Items = () => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState('');

  const submitImage = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    console.log(title, file);

    const result=await axios.post("${import.meta.env.VITE_API_URL}/upload-files",
    formData,
    {
      headers: { "content-Type": "multipart/form-data"},
    }
    );

    console.log(result);


  };

  return (
    <div className="Items">
      <form className="formStyle" onSubmit={submitImage}>
        <div>Resources</div>
        <input
          type="text"
          className="form-control"
          placeholder="Title"
          required
          onChange={(e) => setTitle(e.target.value)}
        />
        <br />
        <input
          type="file"
          className="form-control"
          accept="application/pdf"
          required
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br />
        <button className="btn btn-primary" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
};

export default Items;
