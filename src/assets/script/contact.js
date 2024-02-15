function submitData(e) {
  e.preventDefault();
  const name = document.getElementById("exampleInputName").value;
  const email = document.getElementById("exampleInputEmail").value;
  const phoneNumber = document.getElementById("exampleInputNumber").value;
  const subject = document.getElementById("select").value;
  const message = document.getElementById("floatingTextarea2").value;

  if (name === "" || email === "" || phoneNumber === "" || subject === "" || message === "") {
    alert('Please fill out all fields before submitting the form!');
    return; 
  }

  console.log(name);
  console.log(email);
  console.log(phoneNumber);
  console.log(subject);
  console.log(message);

  let a = document.createElement("a");
  console.log(`exampleInputName: ${name}\nexampleInputEmail: ${email}\nexampleInputNumber: ${phoneNumber}\nselect: ${subject}\nfloatingTextarea2: ${message}`);
  a.href = `mailto:ravanoganteng123@gmail.com?subject=${subject}&body=${encodeURIComponent(
    `${message}, nama saya ${name}, kontak saya di ${email}`
  )}`;
  a.click();
}
