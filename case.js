document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('productForm');
    const productList = document.getElementById('productList');
    const productNameInput = document.getElementById('productName');
    const productImageInput = document.getElementById('productImage');
    const quantityNegroInput = document.getElementById('quantityNegro');
    const quantityTransparenteInput = document.getElementById('quantityTransparente');
    const quantity2en1Input = document.getElementById('quantity2en1');
    const searchInput = document.getElementById('searchInput');

    const filterButtons = document.querySelectorAll('.filter-btn');

    let products = [];
    try {
        products = JSON.parse(localStorage.getItem('products')) || [];
    } catch (e) {
        console.error("Error al cargar los datos de localStorage. Se iniciará el inventario vacío.", e);
        products = [];
    }

    renderProducts(products);

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = productNameInput.value.trim();
        const image = productImageInput.value.trim() || 'https://via.placeholder.com/50?text=Protector';
        const quantityNegro = parseInt(quantityNegroInput.value) || 0;
        const quantityTransparente = parseInt(quantityTransparenteInput.value) || 0;
        const quantity2en1 = parseInt(quantity2en1Input.value) || 0;
        
        const totalQuantity = quantityNegro + quantityTransparente + quantity2en1;

        if (name && totalQuantity > 0) {
            const existingProduct = products.find(p => p.name.toLowerCase() === name.toLowerCase());
            const newVariants = [];

            if (quantityNegro > 0) {
                newVariants.push({ color: "Negro", quantity: quantityNegro });
            }
            if (quantityTransparente > 0) {
                newVariants.push({ color: "360", quantity: quantityTransparente });
            }
            if (quantity2en1 > 0) {
                newVariants.push({ color: "2 en 1", quantity: quantity2en1 });
            }

            if (existingProduct) {
                newVariants.forEach(newVar => {
                    const existingVariant = existingProduct.variants.find(v => v.color.toLowerCase() === newVar.color.toLowerCase());
                    if (existingVariant) {
                        existingVariant.quantity += newVar.quantity;
                    } else {
                        existingProduct.variants.push(newVar);
                    }
                });
            } else {
                const newProduct = {
                    id: Date.now(),
                    name,
                    image,
                    timestamp: new Date().toLocaleString(),
                    variants: newVariants
                };
                products.push(newProduct);
            }

            saveProducts();
            renderProducts(products);
            form.reset();
        }
    });
    
    function renderProducts(items) {
        productList.innerHTML = '';
        items.forEach(product => {
            const li = document.createElement('li');
            li.classList.add('product-item');
            
            const variantsContainerHTML = (Array.isArray(product.variants) ? product.variants : [])
                .map(variant => `
                    <div class="variant-box">
                        <span class="variant-quantity">${variant.quantity} unidades</span>
                        <span class="variant-color">${variant.color}</span>
                    </div>
                `).join('');

            li.innerHTML = `
                <div class="product-info">
                    <img src="${product.image}" alt="Imagen de ${product.name}" class="product-image">
                    <div>
                        <strong>${product.name}</strong>
                        <br>
                        <small>Agregado el: ${product.timestamp}</small>
                    </div>
                </div>
                <div class="product-variants-container">
                    ${variantsContainerHTML}
                </div>
                <div class="product-actions">
                    <button class="sold-btn" data-id="${product.id}">Vendido</button>
                    <button class="edit-btn" data-id="${product.id}">Editar</button>
                    <button class="delete-btn" data-id="${product.id}">Eliminar</button>
                </div>
            `;
            
            const totalQuantity = (Array.isArray(product.variants) ? product.variants : []).reduce((sum, v) => sum + v.quantity, 0);
            if (totalQuantity === 0) {
                li.classList.add('sold-out-item');
            }

            productList.appendChild(li);
        });
    }

    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
    }

    function editProductDetailsAndVariants(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const editOption = prompt("¿Qué quieres editar?\n1. Nombre e Imagen\n2. Unidades\n(Ingresa 1 o 2)");
        
        if (editOption === "1") {
            const newName = prompt(`Editar el Modelo (anterior: ${product.name}):`, product.name);
            if (newName !== null) {
                product.name = newName.trim();
            }

            const newImage = prompt(`Editar la URL de la Imagen (anterior: ${product.image}):`, product.image);
            if (newImage !== null) {
                product.image = newImage.trim();
            }
        } else if (editOption === "2") {
            const colorToEdit = prompt(`Ingresa el Color del protector que quieres editar:\n- Negro\n- 360\n- 2 en 1`);
            
            if (colorToEdit === null || colorToEdit.trim() === '') return;

            const variantToEdit = product.variants.find(v => v.color.toLowerCase() === colorToEdit.toLowerCase());

            if (variantToEdit) {
                const newQuantity = prompt(`Ingresa la nueva cantidad para ${variantToEdit.color} (actual: ${variantToEdit.quantity}):`);
                const parsedQuantity = parseInt(newQuantity);

                if (!isNaN(parsedQuantity) && parsedQuantity >= 0) {
                    variantToEdit.quantity = parsedQuantity;
                } else if (newQuantity !== null) {
                    alert('Por favor, ingresa un número válido y no negativo.');
                }
            } else {
                alert('No se encontró un color que coincida con el ingresado.');
            }
        } else {
            alert('Opción no válida. Por favor, intenta de nuevo.');
            return;
        }

        saveProducts();
        renderProducts(products);
    }
    
    function setupEventListeners() {
        productList.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.classList.contains('sold-btn')) {
                const productId = parseInt(target.dataset.id);
                const product = products.find(p => p.id === productId);
                
                if (product) {
                    const colorToSell = prompt(`Ingresa el Color del protector que quieres vender del modelo ${product.name}:`);
                    if (colorToSell === null || colorToSell.trim() === '') return;
                    
                    const variantToSell = product.variants.find(v => v.color.toLowerCase() === colorToSell.toLowerCase());

                    if (variantToSell && variantToSell.quantity > 0) {
                        variantToSell.quantity--;
                        saveProducts();
                        renderProducts(products);
                        alert(`¡Vendido! Se restó una unidad de ${product.name} - ${variantToSell.color}.`);
                    } else if (variantToSell) {
                        alert(`El producto ${product.name} - ${variantToSell.color} ya está agotado.`);
                    } else {
                        alert('No se encontró un color que coincida con el ingresado.');
                    }
                }
            } 
            else if (target.classList.contains('delete-btn')) {
                const productId = parseInt(target.dataset.id);
                products = products.filter(product => product.id !== productId);
                saveProducts();
                renderProducts(products);
            } 
            else if (target.classList.contains('edit-btn')) {
                const productId = parseInt(target.dataset.id);
                editProductDetailsAndVariants(productId);
            }
        });

        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');

                const model = e.target.dataset.model;
                let filteredProducts;

                if (model === 'all') {
                    filteredProducts = products;
                } else {
                    filteredProducts = products.filter(product => 
                        product.name.toLowerCase().includes(model.toLowerCase())
                    );
                }
                renderProducts(filteredProducts);
            });
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filteredProducts = products.filter(product =>
                product.name.toLowerCase().includes(query) ||
                (Array.isArray(product.variants) && product.variants.some(v => v.color.toLowerCase().includes(query)))
            );
            renderProducts(filteredProducts);
        });

        // === Lógica para la sección "Total por Color" ===
        const colorTotalInput = document.getElementById('colorTotalInput');
        const calculateTotalBtn = document.getElementById('calculateTotalBtn');
        const colorTotalResult = document.getElementById('colorTotalResult');

        calculateTotalBtn.addEventListener('click', () => {
            const colorToFind = colorTotalInput.value.toLowerCase().trim();
            let total = 0;

            if (colorToFind === '') {
                colorTotalResult.textContent = 'Por favor, ingresa un color.';
                colorTotalResult.style.color = 'red';
                return;
            }

            products.forEach(product => {
                const variant = product.variants.find(v => v.color.toLowerCase() === colorToFind);
                if (variant) {
                    total += variant.quantity;
                }
            });

            if (total > 0) {
                colorTotalResult.textContent = `Total de "${colorToFind}": ${total} unidades.`;
                colorTotalResult.style.color = 'green';
            } else {
                colorTotalResult.textContent = `No se encontraron unidades para el color "${colorToFind}".`;
                colorTotalResult.style.color = 'red';
            }
        });

        // === Lógica para la nueva sección "Total por Modelo" ===
        const modelTotalInput = document.getElementById('modelTotalInput');
        const calculateModelBtn = document.getElementById('calculateModelBtn');
        const modelTotalResult = document.getElementById('modelTotalResult');

        calculateModelBtn.addEventListener('click', () => {
            const modelToFind = modelTotalInput.value.toLowerCase().trim();
            let total = 0;

            if (modelToFind === '') {
                modelTotalResult.textContent = 'Por favor, ingresa un modelo.';
                modelTotalResult.style.color = 'red';
                return;
            }

            const foundProduct = products.find(p => p.name.toLowerCase().includes(modelToFind));

            if (foundProduct) {
                total = foundProduct.variants.reduce((sum, v) => sum + v.quantity, 0);
                modelTotalResult.textContent = `Total de "${foundProduct.name}": ${total} unidades.`;
                modelTotalResult.style.color = 'green';
            } else {
                modelTotalResult.textContent = `No se encontraron unidades para el modelo "${modelToFind}".`;
                modelTotalResult.style.color = 'red';
            }
        });
    }

    setupEventListeners();
});