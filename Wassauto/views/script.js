const searchInput = document.getElementById('searchInput');
const objectBoxes = document.querySelectorAll('.object-box');
searchInput.addEventListener('input', () => {
  const searchText = searchInput.value.toLowerCase();
  var shouldShow = "";
  objectBoxes.forEach((box) => {
    const element = box.querySelector('.codBook');
    if(element){
      const codBook = box.querySelector('.codBook').textContent.toLowerCase();
      const license = box.querySelector('.license').textContent.toLowerCase();
      const name = box.querySelector('.name').textContent.toLowerCase();
      const email = box.querySelector('.email').textContent.toLowerCase();
      const phones = Array.from(box.querySelectorAll('.indented-phone'))
        .map((phone) => phone.textContent.toLowerCase())
        .join('');
      shouldShow =
        codBook.includes(searchText) ||
        license.includes(searchText) ||
        name.includes(searchText) ||
        email.includes(searchText) ||
        phones.includes(searchText);
    } else{
      const license2 = box.querySelector('.license2').textContent.toLowerCase();
      const model = box.querySelector('.model').textContent.toLowerCase();
      const group = box.querySelector('.group').textContent.toLowerCase();
      const color = box.querySelector('.color').textContent.toLowerCase();
    
      shouldShow =
        license2.includes(searchText) || 
        model.includes(searchText) || 
        group.includes(searchText) || 
        color.includes(searchText);
    }
    box.style.display = shouldShow ? 'flex' : 'none';
  });
});