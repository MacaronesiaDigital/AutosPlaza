// Assuming you have a function to fetch data from your MongoDB and return it as an array
function fetchDataFromMongoDB(collectionName) {
    // Simulating fetching data from MongoDB
    // Replace this with your actual MongoDB fetching logic
    // Example:
    // return axios.get(`/api/${collectionName}`).then(response => response.data);

    // For demonstration, let's return a sample array
    return [
        { id: 1, name: 'Booking 1' },
        { id: 2, name: 'Booking 2' },
        // ... more data
    ];
}

// Function to populate a dropdown with options
function populateDropdown(dropdownId, data) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = '';
    
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        dropdown.appendChild(option);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const bookingsDropdown = document.getElementById('bookings');
    const accessoriesDropdown = document.getElementById('accessories');
    
    // Fetch data from MongoDB for bookings and accessories
    const bookingsData = fetchDataFromMongoDB('bookingsCollection'); // Replace 'bookingsCollection' with your actual collection name
    const accessoriesData = fetchDataFromMongoDB('accessoriesCollection'); // Replace 'accessoriesCollection' with your actual collection name
    
    // Populate dropdowns with data
    populateDropdown('bookings', bookingsData);
    populateDropdown('accessories', accessoriesData);
});