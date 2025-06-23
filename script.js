// Global variables
let products = [];
let currentProductIndex = -1;
let periods = [];
let elements = null;
let currentPeriod = 'current';
let selectedFilterTag = '';

// DOM Elements
let productList;
let productDetails;
let productModal;
let productForm;
let addProductBtn;
let deleteProductBtn;
let closeModalBtn;
let prevProductBtn;
let nextProductBtn;
let periodSelect;
let newPeriodBtn;
let stockIn;
let stockOut;
let addStockBtn;
let removeStockBtn;
let productName;
let unitPrice;
let salePrice;
let currentStock;
let productImage;
let totalInventoryValue;
let totalProducts;
let totalPotentialProfit;
let statsPanel;
let mainContainer;
let viewInventoryBtn;

// Initialize DOM elements
function initializeDOMElements() {
    console.log('Initializing DOM elements...');
    const elements = {
        productList: document.getElementById('productList'),
        productDetails: document.getElementById('productDetails'),
        productModal: document.getElementById('productModal'),
        productForm: document.getElementById('productForm'),
        statsPanel: document.getElementById('statsPanel'),
        mainContainer: document.getElementById('mainContainer'),
        viewInventoryBtn: document.getElementById('viewInventoryBtn'),
        addProductBtn: document.getElementById('addProductBtn'),
        newPeriodBtn: document.getElementById('newPeriodBtn'),
        viewPeriodsBtn: document.getElementById('viewPeriodsBtn'),
        closeModal: document.getElementById('closeModal'),
        prevProduct: document.getElementById('prevProduct'),
        nextProduct: document.getElementById('nextProduct'),
        editImageBtn: document.getElementById('editImageBtn'),
        imageInput: document.getElementById('imageInput'),
        stockIn: document.getElementById('stockIn'),
        stockOut: document.getElementById('stockOut'),
        addStockBtn: document.getElementById('addStockBtn'),
        removeStockBtn: document.getElementById('removeStockBtn'),
        dateRangeModal: document.getElementById('dateRangeModal'),
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate'),
        confirmDateRange: document.getElementById('confirmDateRange'),
        cancelDateRange: document.getElementById('cancelDateRange'),
        periodsHistoryModal: document.getElementById('periodsHistoryModal'),
        periodsList: document.getElementById('periodsList'),
        closePeriodsHistory: document.getElementById('closePeriodsHistory'),
        totalInventoryValue: document.getElementById('totalInventoryValue'),
        totalProducts: document.getElementById('totalProducts'),
        totalPotentialProfit: document.getElementById('totalPotentialProfit')
    };

    // Verify essential elements
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Elemento no encontrado: ${key}`);
            throw new Error(`Elemento esencial no encontrado: ${key}`);
        }
    }

    console.log('DOM elements initialized successfully');
    return elements;
}

// Initialize the application
function init() {
    console.log('Initializing application...');
    
    try {
        // Initialize DOM elements
        elements = initializeDOMElements();

        // Load products
        loadProducts();
        
        // Setup event listeners
        setupEventListeners(elements);
        
        // Setup keyboard navigation
        setupKeyboardNavigation();
        
        // Update statistics
        updateStats();
        
        // Show first product if exists
        if (products.length > 0) {
            selectProduct(0);
        }
        
        // Setup stock controls
        setupStockControls();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        alert(`Error initializing application: ${error.message}. Please reload the page.`);
    }
}

// Función para formatear números
function formatNumber(number) {
    return '$' + Math.round(number || 0).toLocaleString('es-ES');
}

// Update statistics
function updateStats() {
    if (!elements.totalInventoryValue || !elements.totalProducts || !elements.totalPotentialProfit) {
        console.error('Statistics elements not found');
        return;
    }

    const stats = products.reduce((acc, product) => {
        acc.totalValue += product.unitPrice * product.stock;
        acc.totalProducts += 1;
        acc.potentialProfit += (product.salePrice - product.unitPrice) * product.stock;
        return acc;
    }, { totalValue: 0, totalProducts: 0, potentialProfit: 0 });

    elements.totalInventoryValue.textContent = formatNumber(stats.totalValue);
    elements.totalProducts.textContent = stats.totalProducts.toLocaleString('es-ES');
    elements.totalPotentialProfit.textContent = formatNumber(stats.potentialProfit);
}

// Load products from localStorage
async function loadProducts() {
    try {
        console.log('Loading products...');
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
            products = JSON.parse(savedProducts);
            products = products.map(product => ({
                ...product,
                periods: product.periods || { 
                    current: { 
                        stockIn: 0, 
                        stockOut: 0, 
                        sales: 0, 
                        profit: 0,
                        initialStock: product.stock || 0
                    } 
                }
            }));
            console.log('Products loaded successfully:', products);
            loadFilterTags();
            updateProductList();
            updateStats();
        } else {
            console.log('No saved products found');
            products = [];
            loadFilterTags();
            updateProductList();
            updateStats();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        throw new Error('Failed to load products');
    }
}

// Save products to localStorage
async function saveProducts() {
    try {
        localStorage.setItem('products', JSON.stringify(products));
        console.log('Productos guardados exitosamente');
        updateStats();
    } catch (error) {
        console.error('Error al guardar productos:', error);
        showDialog('Error', 'No se pudieron guardar los productos. Por favor, intente nuevamente.');
    }
}

// Load periods for a product
function loadPeriods(product) {
    const periods = {};
    const periodElements = product.getElementsByTagName('period');
    Array.from(periodElements).forEach(period => {
        const periodId = period.getAttribute('id');
        periods[periodId] = {
            stockIn: parseInt(period.getElementsByTagName('stockIn')[0].textContent),
            stockOut: parseInt(period.getElementsByTagName('stockOut')[0].textContent),
            sales: parseFloat(period.getElementsByTagName('sales')[0].textContent),
            profit: parseFloat(period.getElementsByTagName('profit')[0].textContent)
        };
    });
    return periods;
}

// Update the product list in the sidebar
function updateProductList() {
    const productList = document.getElementById('productList');
    if (!productList) return;

    productList.innerHTML = '';
    
    // Filtrar productos si hay una etiqueta seleccionada
    const filteredProducts = selectedFilterTag 
        ? products.filter(product => 
            product.tags && product.tags.some(tag => tag.id === selectedFilterTag))
        : products;
    
    filteredProducts.forEach((product, index) => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.dataset.id = product.id;
        
        const tagsHtml = product.tags ? product.tags.map(tag => `
            <span class="product-tag" style="background-color: ${tag.color}">${tag.name}</span>
        `).join('') : '';
        
        item.innerHTML = `
            <span class="product-name">${product.name || ''}</span>
            <span class="product-stock">${product.currentStock?.toLocaleString() || '0'}</span>
            <div class="product-tags">${tagsHtml}</div>
        `;
        
        item.addEventListener('click', () => selectProduct(products.findIndex(p => p.id === product.id)));
        productList.appendChild(item);
    });
}

// Custom dialog functions
function showDialog(title, message) {
    alert(`${title}\n${message}`);
}

// Función para mostrar el diálogo de edición
async function showEditDialog(message, currentValue) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'edit-dialog';
        dialog.innerHTML = `
            <div class="edit-dialog-content">
                <h3>${message}</h3>
                <input type="number" id="editValue" value="${currentValue.replace(/[^0-9.-]/g, '')}" step="0.01">
                <div class="edit-dialog-buttons">
                    <button class="btn-primary" id="confirmEdit">Guardar</button>
                    <button class="btn-secondary" id="cancelEdit">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const input = dialog.querySelector('#editValue');
        input.focus();
        input.select();

        dialog.querySelector('#confirmEdit').addEventListener('click', () => {
            const newValue = input.value;
            document.body.removeChild(dialog);
            resolve(newValue);
        });

        dialog.querySelector('#cancelEdit').addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(null);
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                dialog.querySelector('#confirmEdit').click();
            } else if (e.key === 'Escape') {
                dialog.querySelector('#cancelEdit').click();
            }
        });
    });
}

// Select a product to display its details
function selectProduct(index) {
    if (!elements.productDetails) {
        console.error('Product details element not found');
        return;
    }

    currentProductIndex = index;
    const product = products[index];
    
    if (product) {
        // Add transition animation
        elements.productDetails.classList.add('fade-out');
        
        setTimeout(() => {
            // Update basic product information
            const productName = elements.productDetails.querySelector('#productName');
            const unitPrice = elements.productDetails.querySelector('#unitPrice');
            const salePrice = elements.productDetails.querySelector('#salePrice');
            const currentStock = elements.productDetails.querySelector('#currentStock');
            
            if (productName) productName.textContent = product.name || '';
            if (unitPrice) unitPrice.textContent = formatNumber(product.unitPrice || 0);
            if (salePrice) salePrice.textContent = formatNumber(product.salePrice || 0);
            if (currentStock) currentStock.textContent = (product.currentStock || 0).toLocaleString();
            
            // Update product image
            const productImage = elements.productDetails.querySelector('#productImage img');
            if (productImage) {
                productImage.src = product.image || 'placeholder.svg';
                productImage.alt = product.name || '';
                productImage.onerror = function() {
                    this.src = 'placeholder.svg';
                };
            }

            // Update financial analysis
            updateFinancialAnalysis(product);
            
            // Show the details
            elements.productDetails.style.display = 'block';
            elements.productDetails.classList.remove('fade-out');
            elements.productDetails.classList.add('fade-in');
        }, 300);
    } else {
        const productName = elements.productDetails.querySelector('#productName');
        if (productName) productName.textContent = 'Seleccione un producto';
        elements.productDetails.style.display = 'none';
    }
    
    // Update selected state in list
    const productItems = elements.productList.querySelectorAll('.product-item');
    productItems.forEach((item, i) => {
        if (i === index) {
            item.classList.add('selected');
            // Scroll to selected element
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            item.classList.remove('selected');
        }
    });
}

// Update period-specific information
function updatePeriodInfo() {
    const product = products[currentProductIndex];
    const periodData = product.periods[currentPeriod] || {
        stockIn: 0,
        stockOut: 0,
        sales: 0,
        profit: 0
    };
    
    document.getElementById('totalSalesValue').textContent = `$${periodData.sales.toFixed(2)}`;
    document.getElementById('totalProfit').textContent = `$${periodData.profit.toFixed(2)}`;
}

// Add a new product
async function addProduct(productData) {
    try {
        const newProduct = {
            id: Date.now().toString(),
            name: productData.name,
            unitPrice: productData.unitPrice,
            salePrice: productData.salePrice,
            currentStock: productData.initialStock,
            image: 'placeholder.svg',
            tags: productData.tags || [],
            periods: {
                current: {
                    stockIn: productData.initialStock,
                    stockOut: 0,
                    sales: 0,
                    profit: 0,
                    initialStock: productData.initialStock
                }
            }
        };
        
        // Handle image if provided
        const imageFile = productData.image;
        if (imageFile && imageFile.size > 0) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                newProduct.image = e.target.result;
                products.push(newProduct);
                await saveProducts();
                updateProductList();
                selectProduct(products.length - 1);
            };
            reader.readAsDataURL(imageFile);
        } else {
            products.push(newProduct);
            await saveProducts();
            updateProductList();
            selectProduct(products.length - 1);
        }
        
        console.log('Producto agregado exitosamente');
    } catch (error) {
        console.error('Error al agregar producto:', error);
        showDialog('Error', 'No se pudo agregar el producto. Por favor, intente nuevamente.');
        throw error; // Re-lanzar el error para que pueda ser manejado por el llamador
    }
}

// Update product information
function updateProduct(index, productData) {
    const updatedProduct = {
        ...products[index],
        name: productData.name,
        unitPrice: parseFloat(productData.unitPrice),
        salePrice: parseFloat(productData.salePrice),
        stock: parseInt(productData.stock)
    };
    
    // Handle image if provided
    const imageFile = productData.image;
    if (imageFile && imageFile.size > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            updatedProduct.image = e.target.result;
            products[index] = updatedProduct;
            saveProducts();
            updateProductList();
            selectProduct(index);
        };
        reader.readAsDataURL(imageFile);
    } else {
        products[index] = updatedProduct;
        saveProducts();
        updateProductList();
        selectProduct(index);
    }
}

// Función para agregar stock
function addStock(amount) {
    if (currentProductIndex === -1) {
        alert('Por favor seleccione un producto primero');
        return;
    }
    
    const product = products[currentProductIndex];
    if (!product) return;

    // Actualizar stock actual
    product.currentStock = (product.currentStock || 0) + amount;
    
    // Actualizar período actual
    if (!product.periods) {
        product.periods = {};
    }
    if (!product.periods.current) {
        product.periods.current = {
            stockIn: 0,
            stockOut: 0,
            sales: 0,
            profit: 0,
            initialStock: product.currentStock
        };
    }
    
    product.periods.current.stockIn = (product.periods.current.stockIn || 0) + amount;
    
    // Guardar cambios
    saveProducts();
    updateProductList();
    selectProduct(currentProductIndex);
    updateFinancialAnalysis(product);
}

// Función para remover stock
function removeStock(amount) {
    if (currentProductIndex === -1) {
        alert('Por favor seleccione un producto primero');
        return;
    }
    
    const product = products[currentProductIndex];
    if (!product) return;

    // Verificar si hay suficiente stock
    if ((product.currentStock || 0) < amount) {
        alert('No hay suficiente stock disponible');
        return;
    }

    // Actualizar stock actual
    product.currentStock = (product.currentStock || 0) - amount;
    
    // Actualizar período actual
    if (!product.periods) {
        product.periods = {};
    }
    if (!product.periods.current) {
        product.periods.current = {
            stockIn: 0,
            stockOut: 0,
            sales: 0,
            profit: 0,
            initialStock: product.currentStock
        };
    }
    
    // Calcular ventas y ganancias
    const saleAmount = amount * (product.salePrice || 0);
    const costAmount = amount * (product.unitPrice || 0);
    const profitAmount = saleAmount - costAmount;
    
    product.periods.current.stockOut = (product.periods.current.stockOut || 0) + amount;
    product.periods.current.sales = (product.periods.current.sales || 0) + saleAmount;
    product.periods.current.profit = (product.periods.current.profit || 0) + profitAmount;
    
    // Guardar cambios
    saveProducts();
    updateProductList();
    selectProduct(currentProductIndex);
    updateFinancialAnalysis(product);
}

// Función para obtener la última fecha de corte
function getLastPeriodEndDate() {
    const periods = Object.keys(products[0]?.periods || {})
        .filter(period => period !== 'current')
        .map(period => {
            const [start, end] = period.split('_');
            return new Date(end);
        })
        .sort((a, b) => b - a);
    
    return periods[0] || null;
}

// Función para formatear fecha
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Función para mostrar notificación estilo iOS/macOS
function showNotification(message, duration = 2000) {
    // Crear el elemento de notificación si no existe
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
            </div>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
    } else {
        notification.querySelector('span').textContent = message;
    }

    // Mostrar la notificación
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Ocultar la notificación después del tiempo especificado
    setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Función para crear nuevo período
async function createNewPeriod() {
    const dateRangeModal = document.getElementById('dateRangeModal');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    // Obtener la última fecha de corte
    lastPeriodEndDate = getLastPeriodEndDate();
    
    // Si hay una última fecha, establecerla como fecha de inicio
    if (lastPeriodEndDate) {
        const nextDay = new Date(lastPeriodEndDate);
        nextDay.setDate(nextDay.getDate() + 1);
        startDateInput.value = formatDate(nextDay);
    } else {
        // Si no hay fecha anterior, permitir seleccionar la fecha de inicio
        startDateInput.value = formatDate(new Date());
    }
    
    // Establecer la fecha actual como fecha de fin por defecto
    endDateInput.value = formatDate(new Date());
    
    // Mostrar el modal
    dateRangeModal.style.display = 'block';
    
    // Configurar el evento de confirmación
    const confirmDateRange = document.getElementById('confirmDateRange');
    const cancelDateRange = document.getElementById('cancelDateRange');
    
    return new Promise((resolve) => {
        const handleConfirm = () => {
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            
            if (startDate > endDate) {
                showDialog('Error', 'La fecha de inicio no puede ser posterior a la fecha de fin');
                return;
            }
            
            const periodName = `${formatDate(startDate)}_${formatDate(endDate)}`;
            
            // Guardar el stock actual como stock inicial para el nuevo período
            products.forEach(product => {
                // Guardar el período actual antes de crear el nuevo
                if (product.periods['current']) {
                    const currentPeriodData = product.periods['current'];
                    const finalStock = product.currentStock || 0;
                    
                    // Calcular estadísticas adicionales
                    const totalStockInPeriod = (currentPeriodData.initialStock || 0) + (currentPeriodData.stockIn || 0);
                    const totalStockOutPeriod = currentPeriodData.stockOut || 0;
                    const remainingStock = finalStock;
                    
                    // Guardar el período actual con sus datos completos
                    product.periods[periodName] = {
                        stockIn: currentPeriodData.stockIn || 0,
                        stockOut: currentPeriodData.stockOut || 0,
                        sales: currentPeriodData.sales || 0,
                        profit: currentPeriodData.profit || 0,
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        initialStock: currentPeriodData.initialStock || 0,
                        finalStock: finalStock,
                        // Información adicional del período
                        totalStockInPeriod: totalStockInPeriod,
                        totalStockOutPeriod: totalStockOutPeriod,
                        remainingStock: remainingStock,
                        productName: product.name,
                        unitPrice: product.unitPrice,
                        salePrice: product.salePrice
                    };
                    
                    // Reiniciar el período actual con el stock final del período anterior como inicial
                    product.periods['current'] = {
                        stockIn: 0,
                        stockOut: 0,
                        sales: 0,
                        profit: 0,
                        initialStock: finalStock,
                        startDate: new Date().toISOString()
                    };

                    // Asegurarse de que el stock actual se mantenga
                    product.currentStock = finalStock;
                }
            });
            
            currentPeriod = periodName;
            updatePeriodSelect();
            selectProduct(currentProductIndex);
            saveProducts();
            
            // Actualizar la vista para mostrar las estadísticas reseteadas
            if (currentProductIndex !== -1) {
                updateFinancialAnalysis(products[currentProductIndex]);
            }
            
            dateRangeModal.style.display = 'none';
            
            // Mostrar notificación de éxito
            showNotification('Período guardado exitosamente');
            
            resolve();
        };
        
        const handleCancel = () => {
            dateRangeModal.style.display = 'none';
            resolve();
        };
        
        confirmDateRange.onclick = handleConfirm;
        cancelDateRange.onclick = handleCancel;
    });
}

// Actualizar la función updatePeriodSelect para mostrar fechas formateadas
function updatePeriodSelect() {
    if (!periodSelect) return;
    
    periodSelect.innerHTML = '';
    const periods = new Set(['current']);
    
    products.forEach(product => {
        if (product.periods) {
            Object.keys(product.periods).forEach(period => {
                if (period !== 'current') {
                    const [start, end] = period.split('_');
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    const formattedPeriod = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                    periods.add(period);
                }
            });
        }
    });
    
    periods.forEach(period => {
        const option = document.createElement('option');
        option.value = period;
        if (period === 'current') {
            option.textContent = 'Período Actual';
        } else {
            const [start, end] = period.split('_');
            const startDate = new Date(start);
            const endDate = new Date(end);
            option.textContent = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        }
        periodSelect.appendChild(option);
    });
    
    periodSelect.value = currentPeriod;
}

// Delete product
async function deleteProduct(index) {
    try {
        // Remove the product from the array
        products.splice(index, 1);
        
        // Save the updated products list
        await saveProducts();
        
        // Handle the current product selection
        if (index === currentProductIndex) {
            currentProductIndex = -1;
            showProductDetails(null);
        } else if (index < currentProductIndex) {
            currentProductIndex--;
        }
        
        // Update the product list
        updateProductList();
        
        console.log('Producto eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        showDialog('Error', 'No se pudo eliminar el producto. Por favor, intente nuevamente.');
    }
}

// Setup event listeners
function setupEventListeners(elements) {
    console.log('Setting up event listeners...');

    // View Inventory button
    if (elements.viewInventoryBtn) {
        elements.viewInventoryBtn.addEventListener('click', () => {
            console.log('View Inventory button clicked');
            elements.statsPanel.style.display = 'none';
            elements.mainContainer.style.display = 'flex';
            
            // Add back to analytics button if it doesn't exist
            if (!document.getElementById('backToStatsBtn')) {
                const backToStatsBtn = document.createElement('button');
                backToStatsBtn.id = 'backToStatsBtn';
                backToStatsBtn.className = 'btn-primary back-to-stats';
                backToStatsBtn.innerHTML = '📊 Volver a Analíticas';
                backToStatsBtn.style.position = 'fixed';
                backToStatsBtn.style.top = '20px';
                backToStatsBtn.style.right = '20px';
                backToStatsBtn.style.zIndex = '1000';
                document.body.appendChild(backToStatsBtn);

                backToStatsBtn.addEventListener('click', () => {
                    elements.mainContainer.style.display = 'none';
                    elements.statsPanel.style.display = 'block';
                    updateStats();
                });
            }

            if (products.length > 0 && currentProductIndex === -1) {
                selectProduct(0);
            }
            updateProductList();
            updateStats();
        });
    }

    // Add product button
    if (elements.addProductBtn) {
        elements.addProductBtn.addEventListener('click', () => {
            console.log('Add Product button clicked');
            elements.productForm.reset();
            elements.productModal.style.display = 'block';
        });
    }

    // Close modal button
    if (elements.closeModal) {
        elements.closeModal.addEventListener('click', () => {
            console.log('Close Modal button clicked');
            elements.productModal.style.display = 'none';
        });
    }

    // Product form submission
    if (elements.productForm) {
        elements.productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Product form submitted');
            
            try {
                const formData = new FormData(elements.productForm);
                const productData = {
                    name: formData.get('productName'),
                    unitPrice: parseFloat(formData.get('unitPrice')),
                    salePrice: parseFloat(formData.get('salePrice')),
                    initialStock: parseInt(formData.get('initialStock')),
                    image: formData.get('productImage'),
                    tags: getSelectedTags()
                };

                // Si estamos editando un producto existente
                const editId = elements.productForm.dataset.editId;
                if (editId) {
                    const index = products.findIndex(p => p.id === editId);
                    if (index !== -1) {
                        updateProduct(index, productData);
                    }
                } else {
                    // Si es un nuevo producto
                    await addProduct(productData);
                }

                // Cerrar el modal y limpiar el formulario
                elements.productModal.style.display = 'none';
                elements.productForm.reset();
                clearSelectedTags();
                
                // Actualizar la lista de productos y estadísticas
                updateProductList();
                updateStats();
                
            } catch (error) {
                console.error('Error al guardar el producto:', error);
                showDialog('Error', 'No se pudo guardar el producto. Por favor, intente nuevamente.');
            }
        });
    }

    // Stock controls
    if (elements.addStockBtn && elements.stockIn) {
        elements.addStockBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir el comportamiento por defecto del botón
            const inputValue = elements.stockIn.value;
            console.log('Raw input value:', inputValue);
            const amount = parseInt(inputValue, 10);
            console.log('Parsed amount:', amount);
            
            if (!isNaN(amount) && amount > 0) {
                addStock(amount);
                elements.stockIn.value = '';
            } else {
                alert('Por favor ingrese una cantidad mayor a 0');
            }
        });
    }

    if (elements.removeStockBtn && elements.stockOut) {
        elements.removeStockBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir el comportamiento por defecto del botón
            const inputValue = elements.stockOut.value;
            console.log('Raw input value:', inputValue);
            const amount = parseInt(inputValue, 10);
            console.log('Parsed amount:', amount);
            
            if (!isNaN(amount) && amount > 0) {
                removeStock(amount);
                elements.stockOut.value = '';
            } else {
                alert('Por favor ingrese una cantidad mayor a 0');
            }
        });
    }

    // Navigation buttons
    if (elements.prevProduct) {
        elements.prevProduct.addEventListener('click', () => {
            if (currentProductIndex > 0) {
                selectProduct(currentProductIndex - 1);
            }
        });
    }

    if (elements.nextProduct) {
        elements.nextProduct.addEventListener('click', () => {
            if (currentProductIndex < products.length - 1) {
                selectProduct(currentProductIndex + 1);
            }
        });
    }

    // New period button
    if (elements.newPeriodBtn) {
        elements.newPeriodBtn.addEventListener('click', createNewPeriod);
    }

    // View periods button
    if (elements.viewPeriodsBtn) {
        elements.viewPeriodsBtn.addEventListener('click', showPeriodsHistory);
    }

    // Botón de reset
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', resetDatabase);
    }

    // Agregar el evento para el selector de etiquetas de filtro
    const filterTagSelect = document.getElementById('filterTagSelect');
    if (filterTagSelect) {
        filterTagSelect.addEventListener('change', (e) => {
            filterProductsByTag(e.target.value);
        });
    }

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const field = btn.dataset.field;
            const currentValue = document.getElementById(field)?.textContent;
            if (currentValue !== undefined) {
                const newValue = await showEditDialog(`Ingrese el nuevo valor para ${field}:`, currentValue);
                
                if (newValue !== null) {
                    const product = products[currentProductIndex];
                    if (product) {
                        switch (field) {
                            case 'unitPrice':
                                product.unitPrice = parseFloat(newValue);
                                break;
                            case 'salePrice':
                                product.salePrice = parseFloat(newValue);
                                break;
                            case 'currentStock':
                                product.currentStock = parseInt(newValue);
                                break;
                        }
                        saveProducts();
                        selectProduct(currentProductIndex);
                        updateFinancialAnalysis(product);
                    }
                }
            }
        });
    });

    console.log('Event listeners setup completed');
}

// Función para mostrar el historial de períodos
function showPeriodsHistory() {
    const periodsHistoryModal = document.getElementById('periodsHistoryModal');
    const periodsList = document.getElementById('periodsList');
    
    // Limpiar la lista actual
    periodsList.innerHTML = '';
    
    // Obtener todos los períodos únicos de todos los productos
    const allPeriods = new Set();
    products.forEach(product => {
        if (product.periods) {
            Object.keys(product.periods).forEach(period => {
                if (period !== 'current') {
                    allPeriods.add(period);
                }
            });
        }
    });
    
    // Convertir a array y ordenar por fecha (más reciente primero)
    const sortedPeriods = Array.from(allPeriods).sort((a, b) => {
        const [aStart, aEnd] = a.split('_');
        const [bStart, bEnd] = b.split('_');
        return new Date(bEnd) - new Date(aEnd);
    });
    
    // Crear elementos para cada período
    sortedPeriods.forEach(period => {
        const [start, end] = period.split('_');
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        const periodElement = document.createElement('div');
        periodElement.className = 'period-item';
        
        // Calcular estadísticas totales para este período
        const periodStats = products.reduce((stats, product) => {
            const periodData = product.periods[period] || {
                stockIn: 0,
                stockOut: 0,
                sales: 0,
                profit: 0,
                initialStock: 0
            };
            
            stats.totalStockIn += periodData.stockIn;
            stats.totalStockOut += periodData.stockOut;
            stats.totalSales += periodData.sales;
            stats.totalProfit += periodData.profit;
            
            return stats;
        }, {
            totalStockIn: 0,
            totalStockOut: 0,
            totalSales: 0,
            totalProfit: 0
        });
        
        periodElement.innerHTML = `
            <div class="period-header">
                <h3>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</h3>
                <div class="period-actions">
                    <button class="btn-secondary view-period-details" data-period="${period}">Ver Detalles</button>
                    <button class="btn-danger delete-period" data-period="${period}" title="Eliminar período">🗑️</button>
                </div>
            </div>
            <div class="period-summary">
                <div class="summary-item">
                    <span>Entradas:</span>
                    <span>${periodStats.totalStockIn.toLocaleString('es-ES')}</span>
                </div>
                <div class="summary-item">
                    <span>Salidas:</span>
                    <span>${periodStats.totalStockOut.toLocaleString('es-ES')}</span>
                </div>
                <div class="summary-item">
                    <span>Ventas Totales:</span>
                    <span>${formatNumber(periodStats.totalSales)}</span>
                </div>
                <div class="summary-item">
                    <span>Ganancia Total:</span>
                    <span>${formatNumber(periodStats.totalProfit)}</span>
                </div>
            </div>
            <div class="period-details" id="details-${period}" style="display: none;">
                <h4>Detalles por Producto</h4>
                <div class="product-period-list">
                    ${products.map(product => {
                        const periodData = product.periods[period] || {
                            stockIn: 0,
                            stockOut: 0,
                            sales: 0,
                            profit: 0,
                            initialStock: 0,
                            unitPrice: product.unitPrice,
                            salePrice: product.salePrice
                        };
                        return `
                            <div class="product-period-item">
                                <h5>${product.name}</h5>
                                <div class="product-period-stats">
                                    <div class="stats-group">
                                        <div class="stats-group-title">Información Inicial</div>
                                        <div class="stat-item">
                                            <span>Stock Inicial:</span>
                                            <span>${periodData.initialStock.toLocaleString('es-ES')}</span>
                                        </div>
                                        <div class="stat-item">
                                            <span>Precio Unitario:</span>
                                            <span>${formatNumber(periodData.unitPrice || product.unitPrice)}</span>
                                        </div>
                                        <div class="stat-item">
                                            <span>Precio de Venta:</span>
                                            <span>${formatNumber(periodData.salePrice || product.salePrice)}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="stats-group">
                                        <div class="stats-group-title">Movimientos</div>
                                        <div class="stat-item">
                                            <span>Entradas:</span>
                                            <span>${periodData.stockIn.toLocaleString('es-ES')}</span>
                                        </div>
                                        <div class="stat-item">
                                            <span>Salidas:</span>
                                            <span>${periodData.stockOut.toLocaleString('es-ES')}</span>
                                        </div>
                                        <div class="stat-item">
                                            <span>Stock Final:</span>
                                            <span>${(periodData.initialStock + periodData.stockIn - periodData.stockOut).toLocaleString('es-ES')}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="stats-group">
                                        <div class="stats-group-title">Resultados</div>
                                        <div class="stat-item">
                                            <span>Ventas:</span>
                                            <span>${formatNumber(periodData.sales)}</span>
                                        </div>
                                        <div class="stat-item">
                                            <span>Ganancia:</span>
                                            <span>${formatNumber(periodData.profit)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        periodsList.appendChild(periodElement);
    });
    
    // Mostrar el modal
    periodsHistoryModal.style.display = 'block';
    
    // Agregar event listeners para los botones de detalles
    document.querySelectorAll('.view-period-details').forEach(button => {
        button.addEventListener('click', (e) => {
            const period = e.target.dataset.period;
            const detailsElement = document.getElementById(`details-${period}`);
            if (detailsElement.style.display === 'none') {
                detailsElement.style.display = 'block';
                e.target.textContent = 'Ocultar Detalles';
            } else {
                detailsElement.style.display = 'none';
                e.target.textContent = 'Ver Detalles';
            }
        });
    });

    // Agregar event listeners para los botones de eliminar
    document.querySelectorAll('.delete-period').forEach(button => {
        button.addEventListener('click', (e) => {
            const period = e.target.dataset.period;
            deletePeriod(period);
        });
    });
}

// Función para eliminar un período
async function deletePeriod(periodName) {
    if (!confirm('¿Está seguro que desea eliminar este período? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        // Eliminar el período de todos los productos
        products.forEach(product => {
            if (product.periods[periodName]) {
                delete product.periods[periodName];
            }
        });

        // Guardar los cambios
        await saveProducts();
        
        // Actualizar la vista
        showPeriodsHistory();
        
        console.log('Período eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar período:', error);
        showDialog('Error', 'No se pudo eliminar el período. Por favor, intente nuevamente.');
    }
}

// Event Listeners
document.getElementById('viewPeriodsBtn').addEventListener('click', showPeriodsHistory);
document.getElementById('closePeriodsHistory').addEventListener('click', () => {
    document.getElementById('periodsHistoryModal').style.display = 'none';
});

// Initialize the application when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Update financial analysis for a product
function updateFinancialAnalysis(product) {
    if (!product) return;

    const currentPeriod = product.periods?.current || {
        stockIn: 0,
        stockOut: 0,
        sales: 0,
        profit: 0,
        initialStock: 0
    };

    // Calcular valores financieros
    const totalCostPrice = (product.unitPrice || 0) * (product.currentStock || 0);
    const stockValue = (product.salePrice || 0) * (product.currentStock || 0);
    const potentialProfit = stockValue - totalCostPrice;

    // Actualizar elementos de la interfaz
    const elements = {
        totalCostPrice: document.getElementById('totalCostPrice'),
        stockValue: document.getElementById('stockValue'),
        potentialProfit: document.getElementById('potentialProfit'),
        initialStock: document.getElementById('initialStock'),
        addedStock: document.getElementById('addedStock'),
        soldStock: document.getElementById('soldStock'),
        totalStockPeriod: document.getElementById('totalStockPeriod'),
        finalStock: document.getElementById('finalStock'),
        totalSalesValue: document.getElementById('totalSalesValue'),
        totalProfit: document.getElementById('totalProfit')
    };

    // Actualizar valores con verificaciones de null
    if (elements.totalCostPrice) elements.totalCostPrice.textContent = formatNumber(totalCostPrice);
    if (elements.stockValue) elements.stockValue.textContent = formatNumber(stockValue);
    if (elements.potentialProfit) elements.potentialProfit.textContent = formatNumber(potentialProfit);
    if (elements.initialStock) elements.initialStock.textContent = (currentPeriod.initialStock || 0).toLocaleString();
    if (elements.addedStock) elements.addedStock.textContent = (currentPeriod.stockIn || 0).toLocaleString();
    if (elements.soldStock) elements.soldStock.textContent = (currentPeriod.stockOut || 0).toLocaleString();
    if (elements.totalStockPeriod) {
        const totalStockPeriod = (currentPeriod.stockIn || 0) + (currentPeriod.stockOut || 0);
        elements.totalStockPeriod.textContent = totalStockPeriod.toLocaleString();
    }
    if (elements.finalStock) elements.finalStock.textContent = (product.currentStock || 0).toLocaleString();
    if (elements.totalSalesValue) elements.totalSalesValue.textContent = formatNumber(currentPeriod.sales || 0);
    if (elements.totalProfit) elements.totalProfit.textContent = formatNumber(currentPeriod.profit || 0);
}

// Setup keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Solo procesar las teclas si estamos en el inventario
        if (elements.mainContainer.style.display === 'none') return;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const items = document.querySelectorAll('.product-item');
            const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
            
            if (currentIndex === -1) {
                if (items.length > 0) {
                    selectProduct(0);
                }
                return;
            }
            
            let newIndex;
            if (e.key === 'ArrowLeft') {
                newIndex = Math.max(0, currentIndex - 1);
                // Agregar efecto visual para la flecha izquierda
                const prevBtn = document.getElementById('prevProduct');
                if (prevBtn) {
                    prevBtn.classList.add('active');
                    setTimeout(() => prevBtn.classList.remove('active'), 200);
                }
            } else {
                newIndex = Math.min(items.length - 1, currentIndex + 1);
                // Agregar efecto visual para la flecha derecha
                const nextBtn = document.getElementById('nextProduct');
                if (nextBtn) {
                    nextBtn.classList.add('active');
                    setTimeout(() => nextBtn.classList.remove('active'), 200);
                }
            }
            
            if (newIndex !== currentIndex) {
                selectProduct(newIndex);
                items[newIndex].focus();
                
                // Mostrar indicador de navegación
                showNavigationIndicator(e.key === 'ArrowLeft' ? '←' : '→');
            }
        }
    });
}

// Función para mostrar el indicador de navegación
function showNavigationIndicator(direction) {
    let indicator = document.querySelector('.navigation-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'navigation-indicator';
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = direction;
    indicator.classList.remove('fade-out');
    
    setTimeout(() => {
        indicator.classList.add('fade-out');
    }, 300);
}

// Modificar la función createProductListItem para incluir etiquetas
function createProductListItem(product) {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.dataset.id = product.id;
    
    const tagsHtml = product.tags ? product.tags.map(tag => `
        <span class="product-tag" style="background-color: ${tag.color}">${tag.name}</span>
    `).join('') : '';
    
    item.innerHTML = `
        <span class="product-name">${product.name}</span>
        <span class="product-stock">${product.currentStock}</span>
        <div class="product-tags">${tagsHtml}</div>
    `;
    
    return item;
}

// Modificar la función para guardar un producto
function saveProduct(productData) {
    const product = {
        ...productData,
        id: productData.id || Date.now().toString(),
        tags: getSelectedTags(),
        currentStock: parseInt(productData.initialStock) || 0,
        periods: productData.periods || {
            current: {
                stockIn: 0,
                stockOut: 0,
                sales: 0,
                profit: 0,
                initialStock: parseInt(productData.initialStock) || 0
            }
        }
    };

    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
        products[index] = product;
    } else {
        products.push(product);
    }

    localStorage.setItem('products', JSON.stringify(products));
    updateProductList();
    clearSelectedTags();
}

// Modificar la función para cargar un producto
function loadProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        // Cargar datos básicos del producto
        document.getElementById('productName').textContent = product.name;
        document.getElementById('unitPrice').textContent = formatNumber(product.unitPrice);
        document.getElementById('salePrice').textContent = formatNumber(product.salePrice);
        document.getElementById('currentStock').textContent = product.currentStock;
        
        // Cargar etiquetas del producto
        loadProductTags(product.tags);
        
        // ... resto del código de carga del producto ...
    }
}

// Modificar la función para abrir el modal de producto
function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    
    // Limpiar el formulario y las etiquetas seleccionadas
    form.reset();
    clearSelectedTags();
    
    if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            document.getElementById('productNameInput').value = product.name;
            document.getElementById('unitPriceInput').value = product.unitPrice;
            document.getElementById('salePriceInput').value = product.salePrice;
            document.getElementById('initialStockInput').value = product.currentStock;
            
            // Cargar etiquetas del producto
            loadProductTags(product.tags);
            
            form.dataset.editId = productId;
        }
    } else {
        delete form.dataset.editId;
    }
    
    modal.style.display = 'block';
}

// Función para limpiar la base de datos
function resetDatabase() {
    // Mostrar diálogo de confirmación
    const confirmed = confirm('¿Estás seguro? Esta acción eliminará todos los productos y etiquetas. Esta acción no se puede deshacer.');
    
    if (confirmed) {
        try {
            // Limpiar productos
            products = [];
            localStorage.removeItem('products');

            // Limpiar etiquetas
            localStorage.removeItem('productTags');

            // Actualizar la interfaz
            updateProductList();
            updateStats();
            clearSelectedTags();

            // Mostrar mensaje de éxito
            alert('La base de datos ha sido limpiada exitosamente.');
            
            // Recargar la página para asegurar un estado limpio
            window.location.reload();
        } catch (error) {
            console.error('Error al limpiar la base de datos:', error);
            alert('No se pudo limpiar la base de datos. Por favor, intente nuevamente.');
        }
    }
}

// Función para mostrar diálogo de confirmación
function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="dialog-buttons">
                    <button class="btn-secondary dialog-cancel">Cancelar</button>
                    <button class="btn-danger dialog-confirm">Confirmar</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const handleConfirm = () => {
            document.body.removeChild(dialog);
            resolve(true);
        };

        const handleCancel = () => {
            document.body.removeChild(dialog);
            resolve(false);
        };

        dialog.querySelector('.dialog-confirm').addEventListener('click', handleConfirm);
        dialog.querySelector('.dialog-cancel').addEventListener('click', handleCancel);
    });
}

// Agregar el event listener para el botón de reset
document.addEventListener('DOMContentLoaded', () => {
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', resetDatabase);
    }
});

// Actualizar los event listeners para los controles de stock
function setupStockControls() {
    if (elements.addStockBtn && elements.stockIn) {
        elements.addStockBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir el comportamiento por defecto del botón
            const inputValue = elements.stockIn.value;
            console.log('Raw input value:', inputValue);
            const amount = parseInt(inputValue, 10);
            console.log('Parsed amount:', amount);
            
            if (!isNaN(amount) && amount > 0) {
                addStock(amount);
                elements.stockIn.value = '';
            } else {
                //alert('Por favor ingrese una cantidad mayor a 0');
            }
        });
    }

    if (elements.removeStockBtn && elements.stockOut) {
        elements.removeStockBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir el comportamiento por defecto del botón
            const inputValue = elements.stockOut.value;
            console.log('Raw input value:', inputValue);
            const amount = parseInt(inputValue, 10);
            console.log('Parsed amount:', amount);
            
            if (!isNaN(amount) && amount > 0) {
                removeStock(amount);
                elements.stockOut.value = '';
            } else {
                //alert('Por favor ingrese una cantidad mayor a 0');
            }
        });
    }
}

// Función para cargar las etiquetas en el selector de filtro
function loadFilterTags() {
    const filterTagSelect = document.getElementById('filterTagSelect');
    if (!filterTagSelect) return;

    // Mantener la opción "Todas las etiquetas"
    filterTagSelect.innerHTML = '<option value="">Todas las etiquetas</option>';
    
    // Obtener todas las etiquetas únicas de los productos
    const allTags = new Set();
    products.forEach(product => {
        if (product.tags) {
            product.tags.forEach(tag => {
                allTags.add(JSON.stringify(tag));
            });
        }
    });

    // Agregar las etiquetas al selector
    allTags.forEach(tagStr => {
        const tag = JSON.parse(tagStr);
        const option = document.createElement('option');
        option.value = tag.id;
        option.textContent = tag.name;
        filterTagSelect.appendChild(option);
    });
}

// Función para filtrar productos por etiqueta
function filterProductsByTag(tagId) {
    selectedFilterTag = tagId;
    updateProductList();
}