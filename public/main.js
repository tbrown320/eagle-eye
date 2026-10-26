const pencils = document.getElementsByClassName("fa-pencil");
const remove = document.getElementsByClassName("fa-times");
const addMoney = document.getElementsByClassName("add-money");


Array.from(pencils).forEach(function (element) {
  element.addEventListener('click', function () {
    const id = this.parentNode.parentNode.dataset.id
    const amount = this.parentNode.parentNode.querySelector('.newAmount').value
    if (!amount) {
      return alert('Type a new amount in the box first before adding!')
    }
    fetch('transactions', {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'id': id,
        'amount': amount
      })
    })
      .then(response => {
        if (response.ok) return response.json()
      })
      .then(data => {
        console.log(data)
        window.location.reload(true)
      })
  });
});

//delete a transaction
Array.from(remove).forEach(function (element) {
  element.addEventListener('click', function () {
    const id = this.parentNode.parentNode.dataset.id
    fetch('transactions', {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'id': id
      })
    }).then(function (response) {
      window.location.reload()
    })
  });
});
