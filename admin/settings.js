let editBusiness = document.getElementById("editBusiness");

let companyName = document.getElementById("companyName");
let domainName = document.getElementById("domainName");
let companyAddress = document.getElementById("companyAddress");
let savedBusiness = JSON.parse(localStorage.getItem("businessDetails"));

if (savedBusiness) {
    companyName.innerText = savedBusiness.company;
    domainName.innerText = savedBusiness.domain;
    companyAddress.innerText = savedBusiness.address;
}

let isEditing = false;

editBusiness.addEventListener("click", function(event) {

    event.preventDefault();

    if (isEditing == false) {

        editBusiness.innerText = "Save";
        isEditing = true;

        let currentCompany = companyName.innerText;
        let currentDomain = domainName.innerText;
        let currentAddress = companyAddress.innerText;

        companyName.innerHTML = `
            <input type="text" id="companyInput" value="${currentCompany}">
        `;

        domainName.innerHTML = `
            <input type="text" id="domainInput" value="${currentDomain}">
        `;

        companyAddress.innerHTML = `
            <input type="text" id="addressInput" value="${currentAddress}">
        `;
    }
    else {

    let newCompany = document.getElementById("companyInput").value;
    let newDomain = document.getElementById("domainInput").value;
    let newAddress = document.getElementById("addressInput").value;
    let businessDetails = {
    company: newCompany,
    domain: newDomain,
    address: newAddress
};

localStorage.setItem("businessDetails", JSON.stringify(businessDetails));

    companyName.innerText = newCompany;
    domainName.innerText = newDomain;
    companyAddress.innerText = newAddress;

    editBusiness.innerText = "Edit";
    isEditing = false;

}

});