import { useState, useEffect } from 'react';
import './AddIntervalDays.css';
import axios from 'axios';
import { Dna } from 'react-loader-spinner';
function TagsInput() {
    const [tags, setTags] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [currentURL, setCurrentURL] = useState('');
    const [data, setData] = useState([]);
    useEffect(() => {
        setCurrentURL(window.location.hostname); // Get the current URL when the component mounts
        localStorage.setItem("tempStoreName", window.location.hostname);

        // Fetch data from the API
        fetch('https://sealapp-6ptb.onrender.com/getadd/addIntervalDays')
            .then(response => response.json())
            .then(data => {
                setData(data.subscription_interval_days)
                setIsLoading(false);
            })
            .catch(error => {
                setIsLoading(false);
                console.error('Error fetching data:', error)
            });
    }, []);

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    }
    const removeLastTag = () => {
        if (tags.length > 0) {
            const updatedTags = [...tags];
            updatedTags.pop();
            setTags(updatedTags);
        }
    };

    // const removeTag = (index) => {
    //     // console.log("Trying to remove tag at index:", index);

    //     // const updatedTags = [...tags];
    //     // updatedTags.splice(index, 1);
    //     // setTags(updatedTags);

    // };

    const removeTag = (tag, index) => {
        console.log("Removing tag:", tag);
        // setTags(tag);
        axios.post('https://sealapp-6ptb.onrender.com/remove/addIntervaldays',
            {
                tag: tag,
                url: currentURL
            }) // Adjust the API endpoint as needed
            .then(response => {
                console.log('Tag remove successfully:', response.data, currentURL);
                const updatedTags = [...tags];
                const removeUpdateData = updatedTags.splice(index, 1);
                setTags(updatedTags);
                console.log('Tag update successfully:', removeUpdateData);

            })
            .catch(error => {
                console.error('Error adding tag:', error);
            });
    };

    const addTag = () => {
        // if (inputValue.trim()) {
        //     setTags([...tags, inputValue]);
        //     setInputValue('');
        // }
        axios.post('https://sealapp-6ptb.onrender.com/add/addIntervalDays',
            {
                tag: inputValue,
                url: currentURL
            }) // Adjust the API endpoint as needed
            .then(response => {
                console.log('Tag added successfully:', response.data, currentURL);
                setTags([...tags, inputValue]);
                setInputValue('');
            })
            .catch(error => {
                console.error('Error adding tag:', error);
            });
    };
    const allTags = [...data, ...tags];
    return (
        <div className='interval_days__content'>
            <h2 className='interval__days'>Add Interval Days</h2>
            <div className='ineterval__days__content'>
                <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    type="text"
                    className="tags-input"
                    placeholder="Enter the inerval days...."
                />
                <button onClick={addTag} className="add-button">Add</button>
            </div>
            <div className="tags-input-container">

                {isLoading && (
                    <Dna
                        visible={true}
                        height={80}
                        width={80}
                        ariaLabel="dna-loading"
                        wrapperStyle={{}}
                        wrapperClass="dna-wrapper"
                    />
                )}
                {!isLoading && (
                    <>
                        {allTags.map((tag, index) => (
                            <div className="tag-item" key={index}>
                                <span className="text">{tag}</span>
                                <span className="close" onClick={() => removeTag(tag, index)}>&times;</span>
                            </div>
                        ))}
                    </>
                )}

            </div>
        </div>
    );
}

export default TagsInput;
