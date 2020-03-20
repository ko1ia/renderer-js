let container = document.querySelector('#cruises');
let template = document.querySelector('#template_cruise');
let cruises = loadData();


let idElem = document.getElementById('id').value;
let action = document.getElementById('action').value;
let photo = document.getElementById('photo');
let name = document.getElementById('name');
let route = document.getElementById('route');
let time = document.getElementById('time');
let price = document.getElementById('price');
let old_price = document.getElementById('old-price');

(async function () {
    if(localStorage.getItem('cruises') === null) {
        return saveData(await getData())
    }
    return saveData(loadData());
})();

async function getData() {
    return await fetch('js/data.json')
        .then(resp => resp.json())
}

function saveData(data) {
    localStorage.setItem('cruises', JSON.stringify(data));
}

function loadData() {
    return JSON.parse(localStorage.getItem('cruises'));
}

let button = document.getElementById('add_card');
button.addEventListener('click', function (e) {
    e.preventDefault();
    let newCard = {
        "id": idElem,
        "img": {
            "large":  photo.value,
            "normal": photo.value,
            "small": photo.value
        },
        "name": name.value,
        "route": route.value,
        "time": time.value,
        "price": price.value,
        "old_price": old_price.value
    };
    if(action === 'add') {
        newCard.id = cruises[cruises.length-1].id + 1;
        cruises.push(newCard);
        saveData(cruises);
        addCardTemplate(container, newCard, 'add');
    } else {
        let editElem = cruises.findIndex(item => item.id === idElem);
        cruises[editElem] = newCard;
        addCardTemplate(container, newCard, 'edit', editElem);
        saveData(cruises);
        button.textContent = 'Создать';
        action = 'add';
    }


});

function getTag(cruise) {
    return cruise.tag_text ? `<div class="tag ${cruise.category === `bestseller` ? 'bestseller' : ''}">${cruise.tag_text}</div>` : ''
}

function getCruiseInfo(cruise) {
    return `
        <div class="cruise__info">
            <h3>
                <button class="cruise__title-link">${cruise.name}
                    <img class="item_icon" src="img/icons/angle_right.png"  aria-hidden="true" alt="Icon">
                </button>
            </h3>
            <p class="cruise__route"><b>Маршрут:</b> <span>${cruise.route}</span> </p>
            <p class="cruise__time"><b>Продолжительность:</b> <span>${cruise.time}</span></p>
            <strong class="cruise__price">${cruise.price}</strong>
        </div>
    `;
}

function getCruiseImg(cruise) {
    return `
        <picture>
          <source srcset="${cruise.img.small}" media="(max-width: 639px)">
          <source srcset="${cruise.img.normal}" media="(min-width: 640px) and (max-width: 1023px)">
          <source srcset="${cruise.img.large}" media="(min-width: 1024px)">
          <img class="card__img" src="${cruise.img.large}" alt="My image">
        </picture>
    `
}

function addCardHtml(container, cruise) {
    container.insertAdjacentHTML('beforeend', `
    <li class="card">
        <article>
            ${getTag(cruise)}
            ${getCruiseImg(cruise)}
            ${getCruiseInfo(cruise)}
        </article>
    </li>
    `);
}

function addCardTemplate(container, cruise, action, id) {
    let clone = template.content.cloneNode(true);
    if (cruise.tag_text) {
        let tag = document.createElement('div');
        tag.classList.add('tag');
        tag.textContent = cruise.tag_text;
        if (cruise.category === "bestseller") {
            tag.classList.add('bestseller');
        }
        let item = clone.querySelector('.card article');
        item.appendChild(tag);
    }
    clone.querySelector('.card').id = 'id' + cruise.id;
    clone.querySelector('.card__img').src = cruise.img.large;
    clone.querySelector('.button__delete').addEventListener('click', (e) => {
        deleteCard(cruise.id);
    });
    clone.querySelector('.button__edit').addEventListener('click', (e) => {
        editCard(cruise.id);
    });
    clone.querySelector('.cruise__title-link').textContent = cruise.name;
    clone.querySelector('.cruise__route span').textContent = cruise.route;
    clone.querySelector('.cruise__time span').textContent = cruise.time;
    clone.querySelector('.price').textContent = cruise.price;
    clone.querySelector('.price-old').textContent = cruise.old_price;

    if(action === 'add') {
        container.appendChild(clone);
    } else {
        container.replaceChild(clone, document.querySelectorAll('.card')[id]);
    }
}

function editCard(id) {
    let elem = document.getElementById('id' + id);
    let form = document.querySelector('.add_cruise');
    form.scrollIntoView({behavior: 'smooth'});
    button.textContent = 'Редактировать';
    action = 'edit';
    idElem = id;
    photo.value = elem.querySelector('.card__img').src;
    name.value = elem.querySelector('.cruise__title-link').textContent;
    route.value = elem.querySelector('.cruise__route span').textContent;
    time.value = elem.querySelector('.cruise__time span').textContent;
    price.value = elem.querySelector('.price').textContent;
    old_price.value = elem.querySelector('.price-old').textContent;
}

function deleteCard(id) {
    let elem = document.getElementById('id' + id);
    elem.parentNode.removeChild(elem);
    cruises.splice(cruises.findIndex(item => item.id === id), 1);
    saveData(cruises);
}

function renderCards(method = 2) {
    for (let i = 0; i < cruises.length; i++) {
        if (method === 1) {
            addCardHtml(container, cruises[i]);
        } else if (method === 2) {
            addCardTemplate(container, cruises[i], 'add');
        } else if (method === 3) {
            //TODO
        }
    }
}

renderCards();




