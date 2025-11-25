// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import NavbarPage from "./customNavbar";
import Sidebar from "./Sidebar";

const UploadResource = () => {
    const [formData, setFormData] = useState({
        type: '',
        title: '',
        description: '',
        file: null,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, file: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('type', formData.type);
        data.append('title', formData.title);
        data.append('description', formData.description);
        if (formData.file) data.append('file', formData.file);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/resources/upload`, {
                method: 'POST',
                body: data,
            });
            const result = await response.json();
            if (response.ok) {
                alert('Resource uploaded successfully');
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while uploading the resource.');
        }
    };

    return (
        <div>
             <Sidebar />
             <NavbarPage />
             <div style={styles.container}>
            <h2 style={styles.heading}>Upload Resource</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div>
                    <label style={styles.label}>Type:</label>
                    <select name="type" onChange={handleChange} required style={styles.input}>
                        <option value="">Select Type</option>
                        <option value="pdf">PDF</option>
                        <option value="video">Video</option>
                        <option value="text">Text</option>
                    </select>
                </div>
                <div>
                    <label style={styles.label}>Title:</label>
                    <input
                        type="text"
                        name="title"
                        onChange={handleChange}
                        required
                        style={styles.input}
                    />
                </div>
                <div>
                    <label style={styles.label}>Description:</label>
                    <textarea
                        name="description"
                        onChange={handleChange}
                        style={styles.textarea}
                    ></textarea>
                </div>
                <div>
                    <label style={styles.label}>File:</label>
                    <input
                        type="file"
                        name="file"
                        onChange={handleFileChange}
                        style={styles.input}
                    />
                </div>
                <button type="submit" style={styles.button}>
                    Upload
                </button>
            </form>
        </div>
        </div>
    );
};

const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        margin: '20px auto',
        padding: '20px',
        paddingTop: "80px",
        maxWidth: '500px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    heading: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '20px',
        fontWeight: 'bold',
    },
    headingHover: {
        backgroundColor: '#333',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    label: {
        fontWeight: 'bold',
        marginBottom: '5px',
        color: '#555',
    },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    },
    textarea: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '14px',
        resize: 'vertical',
        minHeight: '80px',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    },
    button: {
        padding: '10px 20px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: '#007bff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease, transform 0.2s ease',
    },
    buttonHover: {
        backgroundColor: '#0056b3',
    },
};

export default UploadResource;
