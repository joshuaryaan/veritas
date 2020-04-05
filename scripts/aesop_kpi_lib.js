var periodSelected,
    selectedCurrencySymbol,
    timePeriodError = false,
    documentTitle = document.title,
    pageHeaders = [],
    oldTableOffsetTop = 0;




$('#week-year-from, #week-year-to').on('change', function () {
    var year = $(this).val();
    if (year) {
        year = moment(year, 'YYYY');
        var of = $(this).prev().data('of');
        $('option', $(this).prev()).each(function () {
            var optionVal = $(this).val();
            // $(this).html(year.week(optionVal)[of]('week').format('DD-MMM') + ' &nbsp;&nbsp;(WK ' + optionVal + ')');
            $(this).html(year.week(optionVal).add(1, 'weeks')[of]('week').format('DD-MMM') + ' &nbsp;&nbsp;(WK ' + optionVal + ')');
        });
    }
});

$('.input-group.date > select.form-control, .period-select').on('change', function () {
    var filter = getFilterObject(isProfitability());

    if (!filter.start_date || !filter.end_date) {
        timePeriodError = true;
        $('.input-group.date > select[id$="-from"]').parent('.input-group.date').toggleClass('has-error', !filter.start_date);
        $('.input-group.date > select[id$="-to"]').parent('.input-group.date').toggleClass('has-error', !filter.end_date);

    } else if (moment(filter.start_date) > moment(filter.end_date)) {
        timePeriodError = true;
        $('.input-group.date:not(.has-error)').addClass('has-error');

    } else {
        timePeriodError = false;
        $('.input-group.date.has-error').removeClass('has-error');
    }

    $('#filter-refresh').attr('disabled', timePeriodError);
});
$(document).on('keyup', '.wrapper > .row.filter :input', function (e) {
    if (e.which == 13 && !timePeriodError)
        $('#filter-refresh:not(:disabled)').trigger('click');
});

function createFilters(filterDefault, isProfitability) {
    var currencyFilterSelector, localStorageCurrencyName;
    if (isProfitability) {
        currencyFilterSelector = '.currency-filter-profitability';
        localStorageCurrencyName = 'profitability_currency';
        attachTimeButtons();
    } else {
        currencyFilterSelector = '.currency-filter';
        localStorageCurrencyName = 'pillar_currency';
        attachTimeButtonsNonFY();
    }

    function setCurrencyFilter() {
        var $defaultCurrency;
        var sbs_currency = localStorage.getItem(localStorageCurrencyName);
        if (sbs_currency !== null) {
            $defaultCurrency = $('li[value="' + sbs_currency + '"]', currencyFilterSelector);
        } else {
            sbs_currency = USER_PROFILE.home_sbs_no[0];
            if (isProfitability) {
                $defaultCurrency = $('li[value="' + sbs_currency + '"]', '.currency-filter');
                if ($defaultCurrency.length) {
                    $defaultCurrency = $('li[value="' + $('#' + $defaultCurrency.attr('id').replace('currency_switch_', '')).attr('value') + '"]', '.currency-filter-profitability');
                }
            } else {
                $defaultCurrency = $('li[value="' + sbs_currency + '"]', currencyFilterSelector);
            }
        }
        $('.currency_dropdown').text($defaultCurrency.addClass('selected').first().text());
    }

    if (isProfitability) {
        function createProfitabilityCurrencyList(currencies) {
            $('.currency-filter').hide();
            var currencyFilterProfitabilityHtml = '';
            currencies.forEach(function (currency) {
                currencyFilterProfitabilityHtml += '<li class="text-center" value="' + currency.subsidiary + '" id="' + currency.symbol + '"><a href="#">' + currency.symbol + ' ' + currency.sym + '</a></li>';
            });
            $(currencyFilterSelector).html(currencyFilterProfitabilityHtml).show();

            setCurrencyFilter();
        }

        if (localStorage.getItem('profitability_currency_list') == null) {
            getCurrencyKpi(filterDefault, function (callback) {
                localStorage.setItem('profitability_currency_list', JSON.stringify(callback.data));
                createProfitabilityCurrencyList(callback.data);
            });
        } else {
            createProfitabilityCurrencyList(JSON.parse(localStorage.getItem('profitability_currency_list')));
        }
    } else {
        setCurrencyFilter();
    }

    $(document).on('click', currencyFilterSelector + ' li', function () {
        if ($(this).is('.selected')) return false;
        localStorage.setItem(localStorageCurrencyName, this.value);
        $('#filter-refresh').trigger('click');
        $('.currency_dropdown').text($(this).text());
        $(this).addClass('selected').siblings().removeClass('selected');
        updateSelectedCurrencySymbol();
    });


    $('#level-accordion').html(createAccordion(levelFilterConfig));
    $('#type-accordion').html(createAccordion(storeTypeFilterConfig));
    $('#product-category-accordion').html(createAccordion(productCategoryFilterConfig));

    updateRegionList(filterDefault);
    updateCategoryList(filterDefault);

    $('.accordion-time-toggle, .accordion-level-toggle').not('.active').trigger('click');
    $('.accordion-product-category-toggle').not('.active').trigger('click');
    $('.accordion-min-max-toggle').not('.active').trigger('click');

    if (isProfitability) {
        filterDefault.channel.split(',').forEach(function (channel) {
            $('input[name="channel"][value="' + channel + '"]', '#channel-content').attr('checked', true);
        });
    } else {
        var channelOptions = ['All', 'Retail', 'Department Store', 'Digital']; // , 'Wholesale'
        var channelHtml = '<label><input type="checkbox" value="" name="channel"' +
            (isNullOrEmpty(filterDefault.channel) ? ' checked' : '') + '/> ' + channelOptions.shift() + ' </label><br />';
        channelOptions.forEach(function (value) {
            channelHtml += '<label><input type="checkbox" value="' + value + '" name="channel"' +
                (value == filterDefault.channel ? ' checked' : '') + '/> ' + value + ' </label><br />';
        });
        $('#channel-content').html(channelHtml);

        // when 'All' is checked in Channel accordion, other checkboxes will be unchecked, otherwise 'All' checkbox will be unchecked.
        $("input[name='channel']").on('click', function () {
            if ($(this).val() == '')
                $("input[name='channel']").not(this).prop('checked', false);
            else
                $("input[name='channel']")[0].checked = false;
        });

        var lflOptions = ['All', 'Y', 'N'];
        var lflHtml = '<label><input type="radio" value="" name="lfl"' +
            (isNullOrEmpty(filterDefault.lfl) ? ' checked' : '') + '/> ' + lflOptions.shift() + ' </label><br />';
            lflOptions.forEach(function (value) {
                lflHtml += '<label><input type="radio" value="' + value + '" name="lfl"' +
                (value == filterDefault.lfl ? ' checked' : '') + '/> ' + value + ' </label><br />';
        });
        $('#lfl-content').html(lflHtml);

        var storeOptions = ['All', 'Department Store', 'Shopping Centre', 'Standalone'];
        var storeHtml = '<label><input type="radio" value="" name="store-type"' +
            (isNullOrEmpty(filterDefault.store_type) ? ' checked' : '') + '/> ' + storeOptions.shift() + ' </label><br />';
        storeOptions.forEach(function (value) {
            storeHtml += '<label><input type="radio" value="' + value + '" name="store-type"' +
                (value == filterDefault.store_type ? ' checked' : '') + '/> ' + value + ' </label><br />';
        });
        $('#store-type-content').html(storeHtml);


        var locationOptions = ['All', 'City', 'Suburban'];
        var locationHtml = '<label><input type="radio" value="" name="location-type"' +
            (isNullOrEmpty(filterDefault.location_type) ? ' checked' : '') + '/> ' + locationOptions.shift() + ' </label><br />';
        locationOptions.forEach(function (value) {
            locationHtml += '<label><input type="radio" value="' + value + '" name="location-type"' +
                (value == filterDefault.location_type ? ' checked' : '') + '/> ' + value + ' </label><br />';
        });
        $('#location-type-content').html(locationHtml);


        var gridOptions = ['No Filter', '1+', '1', '2', '3', '3-'];
        var gridHtml = '<label><input type="radio" value="" name="grid-type"' +
            (isNullOrEmpty(filterDefault.sales_grid) ? ' checked' : '') + '/> ' + gridOptions.shift() + ' </label><br />';
        gridOptions.forEach(function (value) {
            gridHtml += '<label><input type="radio" value="' + value + '" name="grid-type"' +
                (value == filterDefault.sales_grid ? ' checked' : '') + '/> ' + value + ' </label><br />';
        });
        $('#grid-type-content').html(gridHtml);
    }


    /* Create Year Options */
    var yearHtml = '';
    // for (var year = 2015; year <= moment().year(); year++)
    //     yearHtml += '<option value="' + year + '">' + year + '</option>';
    // $('select[id$="-year-from"]', '.accordion-time-content').html(yearHtml);
    // yearHtml += '<option value="' + year + '">' + year + '</option>';
    // $('select[id$="-year-to"]', '.accordion-time-content').html(yearHtml);

  for (var year = moment().year() -3; year <= moment().year()+1; year++)
    yearHtml += '<option value="' + year + '">' + year + '</option>';
  $('select[id$="-year-from"]', '.accordion-time-content').html(yearHtml);
  // yearHtml += '<option value="' + year + '">' + year + '</option>';
  $('select[id$="-year-to"]', '.accordion-time-content').html(yearHtml);

    /* Create Week Options */
    var weekHtml = '';
    for (var week = 0; week <= 52; week++)
        weekHtml += '<option value="' + week + '">' + week + '</option>';
    $('select[id^="week-week-"]', '.accordion-time-content').html(weekHtml);


    $('.period-select').on('click', function () {
        $('select.form-control', '.accordion-time-content').hide();
        $('select.form-control[name="' + $(this).val() + '"]', '.accordion-time-content').show();
        // setDateLastYrNonFY();
        periodSelected = $(this).val();
    });

    if (!isNullOrEmpty(filterDefault)) {
        $('input.period-select[value="' + filterDefault.interval + '"]', '.accordion-time-content').click();
        setDate(filterDefault.start_date, filterDefault.end_date, isProfitability);
    } else {
        $('input.period-select:checked', '.accordion-time-content').click();
        if (isProfitability)
            setDateAsLY();
        else
            setDateLastYrNonFY();
    }

    $('#filter-clear').on('click', function () {
        localStorage.removeItem('pillar_filter');
        localStorage.removeItem('consultant_filter');
        localStorage.removeItem('profitability_filter');
        localStorage.removeItem('switches');
        location.reload();
    });

    return isNullOrEmpty(filterDefault) ? getFilterObject(isProfitability) : filterDefault;
}

function getFilterObject(isProfitability) {
    var fromDate, toDate,
        quarterMonthFrom, quarterYearFrom, quarterMonthTo, quarterYearTo,
        monthYearFrom, monthYearTo;

    if (periodSelected === 'year') {
        fromDate = moment($('#year-year-from').val(), 'YYYY').startOf('year').format();
        toDate = moment($('#year-year-to').val(), 'YYYY').endOf('year').format();
    }
    else if (periodSelected === 'quarter') {
        quarterMonthFrom = moment().quarter($('#quarter-month-from').val()).startOf('quarter').format('MM');
        quarterYearFrom = quarterMonthFrom + $('#quarter-year-from').val();
        fromDate = moment(quarterYearFrom, 'MMYYYY').startOf('month').format();
        quarterMonthTo = moment().quarter($('#quarter-month-to').val()).endOf('quarter').format('MM');
        quarterYearTo = quarterMonthTo + $('#quarter-year-to').val();
        toDate = moment(quarterYearTo, 'MMYYYY').endOf('month').format();
    }
    else if (periodSelected === 'month') {
        monthYearFrom = $('#month-month-from').val().concat($('#month-year-from').val());
        fromDate = moment(monthYearFrom, 'MMYYYY').startOf('month').format();
        monthYearTo = $('#month-month-to').val().concat($('#month-year-to').val());
        toDate = moment(monthYearTo, 'MMYYYY').endOf('month').format();
    }
    else if (periodSelected === 'week') {
        fromDate = moment($('#week-year-from').val(), 'YYYY').week($('#week-week-from').val())
            .add(1, 'weeks').startOf('week').format();
        toDate = moment($('#week-year-to').val(), 'YYYY').week($('#week-week-to').val())
            .add(1, 'weeks').endOf('week').format();
    }
    else {
        var fromDateMoment = moment($('#day-day-from').val() + $('#day-month-from').val() + $('#day-year-from').val(), 'DDMMYYYY');
        var toDateMoment = moment($('#day-day-to').val() + $('#day-month-to').val() + $('#day-year-to').val(), 'DDMMYYYY');

        fromDate = fromDateMoment._isValid ? fromDateMoment.format() : false;
        toDate = toDateMoment._isValid ? toDateMoment.format() : false;
    }

    /* Level */
    var regionType = $('input:checked', '#regional-content');
    regionType = (regionType.length ? regionType : $('input', '#regional-content')).map(function () {
        return $(this).val();
    }).get().join();
    var country = $('input:checked', '#country-content').map(function () {
        return $(this).val();
    }).get().join();
    var subregion = $('input:checked', '#subregion-content').map(function () {
        return $(this).val();
    }).get().join();

    /* stores */
    var $checkedStores = $('input:checked', '#store-content');
    var location = ($checkedStores.length ? $checkedStores :
        $('input[type="checkbox"]', '#store-content')).map(function () {
        if (isProfitability) {
            return $(this).val();
        } else {
            var locationValue = $(this).val().split('-');
            return {
                sbs_no: locationValue[0],
                store_no: locationValue[1]
            };
        }
    }).get();

    /* channel */
    var channel;
    if (isProfitability) {
        location = location.length > 0 ? location.join() : '';

        channel = $('input:checked', '#channel-content').map(function () {
            return $(this).val();
        }).get().join();
    } else {
        // channel = $('input:checked', '#channel-content').val();

        channel = $('input:checked', '#channel-content').map(function () {
            return $(this).val();
        }).get().join();
    }

    /* lfl */
    var lfl = $('input:checked', '#lfl-content').val();

    /* Store Type */
    var storeType = $('input:checked', '#store-type-content').val();
    var locationType = $('input:checked', '#location-type-content').val();
    var gridType = $('input:checked', '#grid-type-content').val();

    /* Product and Category */
    var category = $('input:checked', '#category-content').map(function () {
        return $(this).val();
    }).get().join();
    var subCategory = $('input:checked', '#sub-category-content').map(function () {
        return $(this).val();
    }).get().join();
    var product = $('input:checked', '#product-content').map(function () {
        return $(this).val();
    }).get().join();

    return {
        timestamp: Date.now(),
        interval: periodSelected.toLowerCase(),
        start_date: fromDate === '' ? moment().subtract(1, 'year').startOf('year') : fromDate,
        end_date: toDate === '' ? moment().subtract(1, 'year').endOf('year') : toDate,
        subsidiary: '',
        location: location,
        department: '',
        class: channel,
        channel: channel,
        country: country,
        region: regionType,
        subregion: subregion,
        store_type: storeType,
        location_type: locationType,
        sales_grid: gridType,
        category: category,
        sub_category: subCategory,
        product: product,
        lfl: lfl
    };
}

function setSwitches(switchDefault) {
    $('.onoffswitch-checkbox').each(function (index, element) {
        element = $(element);
        if (!isNullOrEmpty(switchDefault) && switchDefault.hasOwnProperty(element.attr('id').replace(/-switch$/, '')))
            element.prop('checked', switchDefault[element.attr('id').replace(/-switch$/, '')]);
    });
}

function getSwitchesObject() {
    var switches = {};
    $('.onoffswitch-checkbox').each(function (index, element) {
        element = $(element);
        switches[element.attr('id').replace(/-switch$/, '')] = element.is(':checked');
    });
    return switches;
}

function setSwitchesLocalStorage(switches) {
    localStorage.setItem('switches', JSON.stringify(switches));
}

function setPillarLocalStorage(filter, isProfitability) {
    filter = isNullOrEmpty(filter) ? getFilterObject(isProfitability) : filter;
    setDate(filter.start_date, filter.end_date, isProfitability);

    if (!isNullOrEmpty($_GET.store)) {
        var old_filter = JSON.parse(localStorage.getItem(PILLAR_FILTER_NAME));
        var new_filter = JSON.parse(JSON.stringify(filter));
        new_filter.location = isNullOrEmpty(old_filter) ? new_filter.location : old_filter.location;
        localStorage.setItem(PILLAR_FILTER_NAME, JSON.stringify(new_filter));
    } else {
        localStorage.setItem(PILLAR_FILTER_NAME, JSON.stringify(filter));
    }
}

function translateProfitabilityForDB(request, filter, callbackFunction) {
    var newFilter = JSON.parse(JSON.stringify(filter));
    var pillarLocations = isNullOrEmpty(newFilter.location) ? [] : newFilter.location.split(',');

    var profitabilityLocations = [];
    USER_STORES.forEach(function (value) {
        if (pillarLocations.contains(value.sbs_no + '-' + value.store_no))
            profitabilityLocations.push(value.netsuite_location);
    });

    if (request == 'like_for_like')
        newFilter.start_date = moment(newFilter.end_date).month('July').startOf('month').subtract(
            moment(newFilter.end_date).quarter() < 3 ? 1 : 0, 'year'
        ).format();

    newFilter.location = profitabilityLocations.join();

    var countryNames = USER_COUNTRIES.filter(function (country) {
        return newFilter.country.split(',').contains(country.sbs_no);
    });

    getNetSuiteData('netsuite_country', function (callback) {
        if (!isNullOrEmpty(callback.data)) {
            var countries = [];
            callback.data.forEach(function (country) {
                if (countryNames.contains(country.name))
                    countries.push(country.id);
            });

            newFilter.country = countries.join();
        }

        getNetSuiteData('netsuite_reporting_region', function (callback) {
            if (!isNullOrEmpty(callback.data)) {
                var regions = [];
                callback.data.forEach(function (region) {
                    if (newFilter.region.split(',').contains(region.name))
                        regions.push(region.id);
                });

                newFilter.region = regions.join();
            }

            callbackFunction(newFilter);
        });
    });
}

var selectedCategories = [];
var selectedSubCategories = [];
var selectedProducts = [];

function updateCategoryList(filter) {
    if (isNullOrEmpty(selectedCategories)) {
        filter = !isNullOrEmpty(filter) ? filter :
            JSON.parse(localStorage.getItem((isProfitability() ? 'profitability' : 'pillar') + '_filter'));
    }
    if (!isNullOrEmpty(filter) && !isNullOrEmpty(filter.category)) {
        selectedCategories = filter.category.split(',');
    }
    // console.log("selectedCategories" + selectedCategories.length)
    var allCategoriesSelected = CATEGORIES.length === selectedCategories.length;
    var categories = [];
    CATEGORIES.forEach(function (data) {
        categories.push({
            type: 'option', value: data.category, label: data.category,
            selected: allCategoriesSelected || selectedCategories.indexOf(data.category) !== -1,
            disabled: false
        });
    });

    $('*', '#category-content').off();
    $('#category-select', $('<div><select id="category-select" name="categories" multiple="multiple"></select></div>')).searchableOptionList({
        data: categories.sort(function (a, b) {
            if (a.label < b.label) return -1;
            if (a.label > b.label) return 1;
            return 0;
        }),
        showSelectAll: true,
        allowNullSelection: true,
        events: {
            onChange: updateSubCategoryList,
            onInitialized: function (sol) {
                sol.$container.toggleClass('disabled', false).appendTo($('#category-content').empty());
                updateSubCategoryList(filter);
            },
            onOpen: solOpen
        }
    });
}

function updateSubCategoryList(filter) {
    if (isNullOrEmpty(selectedSubCategories)) {
        filter = !isNullOrEmpty(filter) ? filter :
            JSON.parse(localStorage.getItem((isProfitability() ? 'profitability' : 'pillar') + '_filter'));
    }
    if (!isNullOrEmpty(filter) && !isNullOrEmpty(filter.sub_category)) {
        selectedSubCategories = filter.sub_category.split(',');
    }
    // console.log(selectedSubCategories);
    // TO DO
    selectedCategories = $('input[type="checkbox"]:checked', '#category-content').map(function () {
        return $(this).val();
    }).get();

    // console.log(selectedCategories);
    var allSubCategoriesSelected = SUB_CATEGORIES.length === selectedSubCategories.length;
    var subCategories = [];
    SUB_CATEGORIES.forEach(function (data) {
        if (!selectedCategories.length || selectedCategories.indexOf(data.category) !== -1) {
            subCategories.push({
                type: 'option',
                value: data.sub_category + '-' + data.category,
                label: data.category + ' : ' + data.sub_category,
                selected: allSubCategoriesSelected || (selectedSubCategories.indexOf(data.sub_category + '-' + data.category) !== -1),
                disabled: false
            });
        }
    });

    $('*', '#sub-category-content').off();
    $('#sub-category-select', $('<div><select id="sub-category-select" name="sub-categories" multiple="multiple"></select></div>')).searchableOptionList({
        data: subCategories.sort(function (a, b) {
            if (a.label < b.label) return -1;
            if (a.label > b.label) return 1;
            return 0;
        }),
        showSelectAll: true,
        allowNullSelection: true,
        events: {
            onChange: updateProductList,
            onInitialized: function (sol) {
                sol.$container.toggleClass('disabled', false).appendTo($('#sub-category-content').empty());
                updateProductList(filter);
            },
            onOpen: solOpen
        }
    });
}

function updateProductList(filter) {
    if (isNullOrEmpty(selectedProducts)) {
        filter = !isNullOrEmpty(filter) ? filter :
            JSON.parse(localStorage.getItem((isProfitability() ? 'profitability' : 'pillar') + '_filter'));
    }
    if (!isNullOrEmpty(filter) && !isNullOrEmpty(filter.product)) {
        selectedProducts = filter.product.split(',');
    }
    selectedSubCategories = $('input[type="checkbox"]:checked', '#sub-category-content').map(function () {
        return $(this).val();
    }).get();
    // console.log(selectedSubCategories);
    var allProductsSelected = PRODUCTS.length === selectedProducts.length;
    var solProducts = [];
    // || selectedCategories.indexOf(data.category) !== -1
    PRODUCTS.forEach(function (data) {
        if (selectedSubCategories.length) {
            if (selectedSubCategories.indexOf(data.sub_category + '-' + data.category) !== -1) {
                solProducts.push({
                    type: 'option',
                    value: data.description1,
                    label: data.description2,
                    selected: (selectedProducts.indexOf(data.description1) !== -1),
                    disabled: false
                });
            }
        }
        else if (selectedCategories.length) {
            if (selectedCategories.indexOf(data.category) !== -1) {
                solProducts.push({
                    type: 'option',
                    value: data.description1,
                    label: data.description2,
                    selected: (selectedProducts.indexOf(data.description1) !== -1),
                    disabled: false
                });
            }
        } else {
            solProducts.push({
                type: 'option',
                value: data.description1,
                label: data.description2,
                selected: allProductsSelected || (selectedProducts.indexOf(data.description1) !== -1),
                disabled: false
            });
        }
    });
    // console.log(solProducts);

    $('*', '#product-content').off();
    $('#product-select', $('<div><select id="product-select" name="products" multiple="multiple"></select></div>')).searchableOptionList({
        data: solProducts.sort(function (a, b) {
            if (a.label < b.label) return -1;
            if (a.label > b.label) return 1;
            return 0;
        }),
        showSelectAll: true,
        allowNullSelection: true,
        events: {
            onChange: function (sol) {
                selectedProducts = $('input:checked', sol.$selection).map(function () {
                    return $(this).val();
                }).get();
            },
            onInitialized: function (sol) {
                sol.$container.toggleClass('disabled', false).appendTo($('#product-content').empty());
            },
            onOpen: solOpen
        }
    });
}

var selectedRegions = [],
    selectedCountries = [],
    filteredCountries = [],
    selectedSubregions = [],
    selectedStores = [];

function updateRegionList(filter) {
    var regionSet = filter && filter.region;
    var allRegionsSelected = regionSet && filter.region.split(',').length >= USER_REGIONS.length;
    var selectAllRegionsAndDisable = USER_REGIONS.length == 1 &&
        ['rgo', 'sub', 'cm', 'rbm', 'smr'].contains(USER_PROFILE.user_type);

    var regional_content_html = '';
    USER_REGIONS.forEach(function (data) {
        if (data.hasOwnProperty('sbs_report_region') && data.sbs_report_region)
            regional_content_html += '<label><input type="checkbox" value="' + data.sbs_report_region + '" ' +
                'data-sbs-region="' + data.sbs_region + '" name="region_type"' +
                (selectAllRegionsAndDisable ||
                (regionSet && !allRegionsSelected && filter.region.contains(data.sbs_report_region)) ? ' checked' : '') +
                (selectAllRegionsAndDisable ? ' disabled' : '') +
                '> ' + data.sbs_report_region + '</label><br />';
    });
    $('input', '#regional-content').off('change');
    $('input', $('#regional-content').html(regional_content_html)).on('change', updateCountryList);

    updateCountryList(filter);
}

function disableCountryFilter(countries) {
    var result = [];
    // var country = $_GET.country;
    countries.forEach(function (value) {
        if (value.selected) {
            result.push({
                type: value.type,
                disabled: true,
                // selected: country == value.label,
                selected: value.selected,
                label: value.label,
                value: value.value,
            })
        }
    });
    return result;
}

function updateCountryList(filter) {
    if (isNullOrEmpty(selectedCountries)) {
        filter = !isNullOrEmpty(filter) ? filter :
            JSON.parse(localStorage.getItem((isProfitability() ? 'profitability' : 'pillar') + '_filter'));
        if (!isNullOrEmpty(filter) && !isNullOrEmpty(filter.country))
            selectedCountries = filter.country.split(',');
    }

    var uniqueCountries = USER_COUNTRIES.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });

    selectedRegions = $('input[type="checkbox"]:checked', '#regional-content').map(function () {
        return $(this).attr('data-sbs-region');
    }).get();

    var allCountriesSelected = selectedCountries.length == uniqueCountries.length;
    var selectAllCountriesAndDisable = uniqueCountries.length == 1 &&
        ['rbm', 'smr'].contains(USER_PROFILE.user_type);

    var countries = [];
    uniqueCountries.forEach(function (data) {
        if (!selectedRegions.length || selectedRegions.indexOf(data.sbs_region) !== -1)
            countries.push({
                type: 'option', value: data.sbs_no, label: data.sbs_name,
                selected: selectAllCountriesAndDisable || (!allCountriesSelected && selectedCountries.contains(data.sbs_no)),
                disabled: selectAllCountriesAndDisable
            });
    });


    // yuan code, m=donation_by_country_graph, donation_by_store_graph
    if ($_GET.m == 'donation_by_country_graph' || $_GET.m == 'donation_by_store_graph') {
        countries = disableCountryFilter(countries);
    }
    // yuan code end

    $('*', '#country-content').off();
    $('#country-select', $('<div><select id="country-select" name="countries" multiple="multiple"></select></div>')).searchableOptionList({
        data: countries.sort(function (a, b) {
            if (a.label < b.label) return -1;
            if (a.label > b.label) return 1;
            return 0;
        }),
        showSelectAll: !selectAllCountriesAndDisable,
        allowNullSelection: true,
        events: {
            onChange: updateSubregionList,
            onInitialized: function (sol) {
                sol.$container.toggleClass('disabled', selectAllCountriesAndDisable).appendTo($('#country-content').empty());
                updateSubregionList(filter);
            },
            onOpen: solOpen
        }
    });
}

function updateSubregionList(filter) {
    if (isNullOrEmpty(selectedSubregions)) {
        filter = !isNullOrEmpty(filter) ? filter :
            JSON.parse(localStorage.getItem((isProfitability() ? 'profitability' : 'pillar') + '_filter'));
        if (!isNullOrEmpty(filter) && !isNullOrEmpty(filter.subregion))
            selectedSubregions = filter.subregion.split(',');
    }

    var stores = USER_STORES;

    stores.sort(function (a, b) {
        a = a.sbs_no + a.sbs_region;
        b = b.sbs_no + b.sbs_region;
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    });

    var subregion_regions = [];
    var subregion_objs = $.map(stores, function (data) {
        if (!isNullOrEmpty(data.sbs_region) && subregion_regions.indexOf(data.sbs_region) == -1) {
            subregion_regions.push(data.sbs_region);
            return data;
        }
    });


    selectedCountries = $('input[type="checkbox"]:checked', '#country-content').map(function () {
        return $(this).val();
    }).get();

    filteredCountries = selectedCountries.length ? selectedCountries :
        $('input[type="checkbox"]', '#country-content').map(function () {
            return $(this).val();
        }).get();

    var subregionSet = filter && filter.subregion;
    var allSubregionsSelected = subregionSet && filter.subregion.length == subregion_objs.length;
    var selectAllSubregionsAndDisable = subregion_objs.length == 1 &&
        ['rbm', 'smr'].contains(USER_PROFILE.user_type);
    var subregion_content_html = '';
    subregion_objs.forEach(function (subregion_obj) {
        var show = (!filteredCountries.length || filteredCountries.contains(subregion_obj.sbs_no));

        subregion_content_html += '<span' + (show ? ' data-toggle="show"' : ' style="display:none;"') + '><label><input type="checkbox" value="' + subregion_obj.sbs_region + '" name="subregion_type"' +
            (selectAllSubregionsAndDisable ||
            (subregionSet && !allSubregionsSelected && filter.subregion.contains(subregion_obj.sbs_region)) ? ' checked' : '') +
            (selectAllSubregionsAndDisable ? ' disabled' : '') +
            '> ' + subregion_obj.sbs_region + '</label><br /></span>';
    });

    var $subregion_content = $('#subregion-content');
    $('input', $subregion_content).off('change');
    var oldHeight = $subregion_content.outerHeight();
    $subregion_content.css('overflow-y', 'hidden').html(subregion_content_html)
        .parent().add($subregion_content.parent().next('br'))[subregion_content_html.contains('data-toggle="show"') ? 'fadeIn' : 'fadeOut']();

    var newHeight = $subregion_content.outerHeight();
    $subregion_content.height(oldHeight).animate({'height': newHeight}, function () {
        $subregion_content.height('auto');
    });

    $('input', $subregion_content).on('change', updateStoreList);

    updateStoreList(filter);
}

function updateStoreList(filter) {
    // yuan code
    var isIntervalTable = !isNullOrEmpty($_GET.store) || !isNullOrEmpty($_GET.store_name);

    if (isNullOrEmpty(selectedStores)) {
        filter = !isNullOrEmpty(filter) ? filter :
            JSON.parse(localStorage.getItem((isProfitability() ? 'profitability' : 'pillar') + '_filter'));
        if (!isNullOrEmpty(filter) && filter.location) {
            selectedStores = isProfitability() ? filter.location.split(',') : $.map(filter.location, function (store) {
                return store.sbs_no + '-' + store.store_no;
            });
        }
    }

    selectedSubregions = $('input[type="checkbox"]:checked', '#subregion-content').map(function () {
        return $(this).val();
    }).get();

    var uniqueStores = USER_STORES.filter(function (store, index, self) {
        return self.indexOf(store) === index &&
            (!filteredCountries.length || filteredCountries.contains(store.sbs_no)) &&
            (!selectedSubregions.length || selectedSubregions.contains(store.sbs_region));
    });

    // alert(JSON.stringify(USER_STORES));
    var allStoresSelected = selectedStores.length >= uniqueStores.length;
    var selectAllStoresAndDisable = uniqueStores.length == 1 ||
        (($_GET.m || '').contains('profitability') && ['smr'].contains(USER_PROFILE.user_type));

    var stores = $.map(uniqueStores, function (store) {
        return {
            type: 'option', value: store.sbs_no + '-' + store.store_no, label: store.store_name,
            selected: selectAllStoresAndDisable ||
            (!allStoresSelected && selectedStores.contains(store.sbs_no + '-' + store.store_no)),
            disabled: selectAllStoresAndDisable || isIntervalTable
        };
    });

    // yuan code
    if (isIntervalTable) {
        if (!isNullOrEmpty($_GET.store_name)) {
            stores = stores.filter(function (store) {
                return $_GET.store_name == store.label;
            });
        } else {
            stores = stores.filter(function (store) {
                console.log(store.selected);
                return store.selected;
            });
        }
    }

    $('*', '#store-content').off();
    $('#store-select', $('<div><select id="store-select" name="stores" multiple="multiple"></select></div>')).searchableOptionList({
        data: stores.sort(function (a, b) {
            if (a.label < b.label) return -1;
            if (a.label > b.label) return 1;
            return 0;
        }),
        showSelectAll: !selectAllStoresAndDisable && !isIntervalTable,
        allowNullSelection: true,
        events: {
            onChange: function (sol) {
                selectedStores = $('input:checked', sol.$selection).map(function () {
                    return $(this).val();
                }).get();
            },
            onInitialized: function (sol) {
                sol.$container.toggleClass('disabled', selectAllStoresAndDisable).appendTo($('#store-content').empty());
            },
            onOpen: solOpen
        }
    });
}

function setDate(startDate, endDate, isProfitability) {
    startDate = moment(startDate);
    endDate = moment(endDate);

    $('#year-year-from').val(startDate.format('YYYY'));
    $('#year-year-to').val(endDate.format('YYYY'));

    $('#quarter-year-from').val(startDate.format('YYYY'));
    $('#quarter-year-to').val(endDate.format('YYYY'));
    $('#quarter-month-from').val(startDate.quarter());
    $('#quarter-month-to').val(endDate.quarter());

    $('#month-year-from').val(startDate.format('YYYY'));
    $('#month-year-to').val(endDate.format('YYYY'));
    $('#month-month-from').val(startDate.format('MM'));
    $('#month-month-to').val(endDate.format('MM'));

    if (!isProfitability) {
        var weekStartDate = startDate.clone().endOf('week');

        $('#week-week-from').val(weekStartDate.week() - 1);
        $('#week-week-to').val(endDate.week() - 1);
        $('#week-year-from').val(weekStartDate.format('YYYY')).trigger('change');
        $('#week-year-to').val(endDate.format('YYYY')).trigger('change');

        $('#day-day-from').val(startDate.format('DD'));
        $('#day-day-to').val(endDate.format('DD'));
        $('#day-month-from').val(startDate.format('MM'));
        $('#day-month-to').val(endDate.format('MM'));
        $('#day-year-from').val(startDate.format('YYYY'));
        $('#day-year-to').val(endDate.format('YYYY'));
    }
}

function getFiscalYears() {
    var current_fiscal_year_start, current_fiscal_year_end, last_fiscal_year_start, last_fiscal_year_end,
        current_calendar_year_start, current_calendar_year_end, last_calendar_year_start, last_calendar_year_end;

    if (moment().quarter() > 2) {
        current_fiscal_year_start = moment().month('July').startOf('month');
        current_fiscal_year_end = moment().add(1, 'year').month('June').endOf('month');
        last_fiscal_year_start = moment().subtract(1, 'year').month('July').startOf('month');
        last_fiscal_year_end = moment().month('June').endOf('month');
    } else {
        current_fiscal_year_start = moment().subtract(1, 'year').month('July').startOf('month');
        current_fiscal_year_end = moment().month('June').endOf('month');
        last_fiscal_year_start = moment().subtract(2, 'year').month('July').startOf('month');
        last_fiscal_year_end = moment().subtract(1, 'year').month('June').endOf('month');
    }

    current_calendar_year_start = moment().month('January').startOf('month');
    current_calendar_year_end = moment().month('December').endOf('month');
    last_calendar_year_start = moment().subtract(1, 'year').month('January').startOf('month');
    last_calendar_year_end = moment().subtract(1, 'year').month('December').endOf('month');

    return {
        fiscal: {
            current: {
                start: current_fiscal_year_start,
                end: current_fiscal_year_end
            },
            last: {
                start: last_fiscal_year_start,
                end: last_fiscal_year_end
            }
        },
        calendar: {
            current: {
                start: current_calendar_year_start,
                end: current_calendar_year_end
            },
            last: {
                start: last_calendar_year_start,
                end: last_calendar_year_end
            }
        }
    }
}

function isNullOrEmpty(val) {
    return val === null || typeof val == 'undefined' || val.length == 0
}

function updateSelectedCurrencySymbol() {
    var pillar = isProfitability() ? '-profitability' : '';

    var output = '';
    // var $currencyDropdown = $('.currency_dropdown');
    var $currencyDropdown = $('.dropdown-menu.currency-filter' + pillar + ' > li.selected > a');
    if ($currencyDropdown.length && $currencyDropdown.html().length && $currencyDropdown.html().contains(' '))
        output = $currencyDropdown.html().split(' ')[1];
    selectedCurrencySymbol = output;
    return output;

    /*var pillar = isProfitability() ? 'profitability' : 'pillar';
    var localCurrency = localStorage[pillar + '_currency'];
    if (!isNullOrEmpty(localCurrency)) {
      var selectedCurrency = CURRENCIES.filter(function (currency) {
        return currency.sbs_no == localCurrency;
      });
      if (selectedCurrency.length)
        output = selectedCurrency[0].sbs_currency_symbol;
    }*/
}

function getSelectedCurrencySymbol(forceUpdate) {
    if (isNullOrEmpty(selectedCurrencySymbol) || forceUpdate)
        return updateSelectedCurrencySymbol();
    return selectedCurrencySymbol;
}

function currency() {
    return ' (<span class="currency-symbol">' + getSelectedCurrencySymbol() + '</span>)';
}

function updateCurrencyDOM(forceUpdate) {
    $('.currency-symbol').html(getSelectedCurrencySymbol(forceUpdate));
    // return selectedCurrencySymbol;
}

function formatInt(value, dec, format) {
    if (isNullOrEmpty(value) || isNaN(value)) value = 0;
    if (isNullOrEmpty(dec) || isNaN(dec)) dec = 0;
    if (isNullOrEmpty(format)) format = '{n}';
    var parsedNumber = parseFloat(value).toFixed(dec).replace(/-(0(\.0+)?)$/, '$1');
    var decimal = '';
    if (parsedNumber.contains('.')) {
        parsedNumber = parsedNumber.split('.');
        decimal = '.' + parsedNumber[1];
        parsedNumber = parsedNumber[0];
    }
    parsedNumber = parsedNumber.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,') + decimal;
    return format
        .replace('$', getSelectedCurrencySymbol())
        .replace('{n}', isNaN(parseFloat(parsedNumber)) ? (0).toFixed(dec) : parsedNumber)
        .replace(selectedCurrencySymbol + '-', '-' + selectedCurrencySymbol);
}

function unFormatInt(string) {
    if (typeof string == 'number') return string;
    return parseFloat(string.trim().match(/[\d.]/g).join(''));
}

function timeStamp() {
    var now = new Date();
    var date = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()];

    var suffix = (time[0] < 12) ? "AM" : "PM";
    time[0] = (time[0] < 12) ? time[0] : time[0] - 12;
    time[0] = time[0] || 12;

    for (var i = 1; i < 3; i++) {
        if (time[i] < 10) {
            time[i] = "0" + time[i];
        }
    }
    return date.join("-") + "_" + time.join("-") + "_" + suffix;
}

function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}

function createAccordion(config) {
    var content = '';
    config.forEach(function (level) {
        var subcontent = group_div.replace(/\$ID/g, level.id)
            .replace('$TITLE', level.title);

        subcontent = subcontent.replace('$INNER',
            inner_div.replace('$CONTENT', typeof level.levels == 'object'
                ? createAccordion(level.levels)
                : level.content));

        content = content + subcontent;
    });
    return content;
}

//accordion
var group_div = '<div class="accordion-group">'
    + '<div class="accordion-heading">'
    + '<a class="accordion-toggle" data-toggle="collapse" href="#$ID">$TITLE</a>'
    + '</div>'
    + '<div class="accordion-body collapse in" id="$ID">$INNER</div>'
    + '</div><br>';
var inner_div = '<div class="accordion-inner">$CONTENT</div>';

var levelFilterConfig = [
    // {id: 'global-content', title: 'Global', content: ''},
    {id: 'regional-content', title: 'Regional', content: ''},
    {id: 'country-content', title: 'Country', content: ''},
    {id: 'subregion-content', title: 'Sub Region', content: ''},
    {id: 'store-content', title: 'Store', content: ''}
];

var storeTypeFilterConfig = [
    {id: 'store-type-content', title: 'Store Type', content: ''},
    {id: 'location-type-content', title: 'Location Type', content: ''},
    {id: 'grid-type-content', title: 'Grid Type', content: ''}
];

var productCategoryFilterConfig = [
    {id: 'category-content', title: 'Category', content: ''},
    {id: 'sub-category-content', title: 'Sub-Category', content: ''},
    {id: 'product-content', title: 'Product', content: ''}
];

function attachTimeButtons() {
    var filterDates = getFiscalYears();

    $('#this_year_btn').click(function () {
        $('#year-year-from').val(filterDates.calendar.current.start.format('YYYY'));
        $('#year-year-to').val(filterDates.calendar.current.end.format('YYYY'));

        $('#quarter-year-from').val(filterDates.calendar.current.start.format('YYYY'));
        $('#quarter-year-to').val(filterDates.calendar.current.end.format('YYYY'));
        $('#quarter-month-from').val(filterDates.calendar.current.start.quarter());
        $('#quarter-month-to').val(filterDates.calendar.current.end.quarter());

        $('#month-year-from').val(filterDates.calendar.current.start.format('YYYY'));
        $('#month-year-to').val(filterDates.calendar.current.end.format('YYYY'));
        $('#month-month-from').val(filterDates.calendar.current.start.format('MM'));
        $('#month-month-to').val(filterDates.calendar.current.end.format('MM'));
    });

    $('#last_year_btn').click(function () {
        $('#year-year-from').val(filterDates.calendar.last.start.format('YYYY'));
        $('#year-year-to').val(filterDates.calendar.last.end.format('YYYY'));

        $('#quarter-year-from').val(filterDates.calendar.last.start.format('YYYY'));
        $('#quarter-year-to').val(filterDates.calendar.last.end.format('YYYY'));
        $('#quarter-month-from').val(filterDates.calendar.last.start.quarter());
        $('#quarter-month-to').val(filterDates.calendar.last.end.quarter());

        $('#month-year-from').val(filterDates.calendar.last.start.format('YYYY'));
        $('#month-year-to').val(filterDates.calendar.last.end.format('YYYY'));
        $('#month-month-from').val(filterDates.calendar.last.start.format('MM'));
        $('#month-month-to').val(filterDates.calendar.last.end.format('MM'));
    });

    $('#this_fy_btn').click(function () {
        $('#year-year-from').val(filterDates.fiscal.current.start.format('YYYY'));
        $('#year-year-to').val(filterDates.fiscal.current.end.format('YYYY'));

        $('#quarter-year-from').val(filterDates.fiscal.current.start.format('YYYY'));
        $('#quarter-year-to').val(filterDates.fiscal.current.end.format('YYYY'));
        $('#quarter-month-from').val(filterDates.fiscal.current.start.quarter());
        $('#quarter-month-to').val(filterDates.fiscal.current.end.quarter());

        $('#month-year-from').val(filterDates.fiscal.current.start.format('YYYY'));
        $('#month-year-to').val(filterDates.fiscal.current.end.format('YYYY'));
        $('#month-month-from').val(filterDates.fiscal.current.start.format('MM'));
        $('#month-month-to').val(filterDates.fiscal.current.end.format('MM'));
    });

    $('#last_fy_btn').click(setDateAsLY);
}

function setDateAsLY() {
    var filterDates = getFiscalYears();

    $('#year-year-from').val(filterDates.fiscal.last.start.format('YYYY'));
    $('#year-year-to').val(filterDates.fiscal.last.end.format('YYYY'));

    $('#quarter-year-from').val(filterDates.fiscal.last.start.format('YYYY'));
    $('#quarter-year-to').val(filterDates.fiscal.last.end.format('YYYY'));
    $('#quarter-month-from').val(filterDates.fiscal.last.start.quarter());
    $('#quarter-month-to').val(filterDates.fiscal.last.end.quarter());

    $('#month-year-from').val(filterDates.fiscal.last.start.format('YYYY'));
    $('#month-year-to').val(filterDates.fiscal.last.end.format('YYYY'));
    $('#month-month-from').val(filterDates.fiscal.last.start.format('MM'));
    $('#month-month-to').val(filterDates.fiscal.last.end.format('MM'));
}

function attachTimeButtonsNonFY() {
    var filterDates = getFiscalYears();

    $('#this_year_btn').click(function () {
        $('#year-year-from').val(filterDates.calendar.current.start.format('YYYY'));
        $('#year-year-to').val(filterDates.calendar.current.end.format('YYYY'));

        $('#quarter-year-from').val(filterDates.calendar.current.start.format('YYYY'));
        $('#quarter-year-to').val(filterDates.calendar.current.end.format('YYYY'));
        $('#quarter-month-from').val(filterDates.calendar.current.start.quarter());
        $('#quarter-month-to').val(filterDates.calendar.current.end.quarter());

        $('#month-year-from').val(filterDates.calendar.current.start.format('YYYY'));
        $('#month-year-to').val(filterDates.calendar.current.end.format('YYYY'));
        $('#month-month-from').val(filterDates.calendar.current.start.format('MM'));
        $('#month-month-to').val(filterDates.calendar.current.end.format('MM'));

        $('#week-year-from').val(filterDates.calendar.current.start.format('YYYY')).change();
        $('#week-year-to').val(filterDates.calendar.current.end.format('YYYY')).change();
        $('#week-week-from').val('1');
        $('#week-week-to').val('52');

        $('#day-year-from').val(filterDates.calendar.current.start.format('YYYY'));
        $('#day-year-to').val(filterDates.calendar.current.end.format('YYYY'));
        $('#day-month-from').val(filterDates.calendar.current.start.format('MM'));
        $('#day-month-to').val(filterDates.calendar.current.end.format('MM'));
        $('#day-day-from').val(filterDates.calendar.current.start.format('DD'));
        $('#day-day-to').val(filterDates.calendar.current.end.format('DD'));
    });

    $('#last_year_btn').click(setDateLastYrNonFY);

    $('#month_to_date_btn').click(function () {
        $('[name="period"][value="day"]').click();

        var first_day_of_month = moment().startOf('month');

        $('[id$="-year-from"]').val(first_day_of_month.format('YYYY')).change();
        $('[id$="-year-to"]').val(moment().format('YYYY')).change();

        $('#quarter-month-from').val(first_day_of_month.quarter());
        $('#quarter-month-to').val(moment().quarter());

        $('#month-month-from, #day-month-from').val(first_day_of_month.format('MM'));
        $('#month-month-to, #day-month-to').val(moment().format('MM'));

        $('#week-week-from').val(first_day_of_month.week());
        $('#week-week-to').val(moment().week());

        $('#day-day-from').val(first_day_of_month.format('DD'));
        $('#day-day-to').val(moment().format('DD'));
    });
}

function setDateLastYrNonFY() {
    var filterDates = getFiscalYears();

    $('#year-year-from').val(filterDates.calendar.last.start.format('YYYY'));
    $('#year-year-to').val(filterDates.calendar.last.end.format('YYYY'));

    $('#quarter-year-from').val(filterDates.calendar.last.start.format('YYYY'));
    $('#quarter-year-to').val(filterDates.calendar.last.end.format('YYYY'));
    $('#quarter-month-from').val(filterDates.calendar.last.start.quarter());
    $('#quarter-month-to').val(filterDates.calendar.last.end.quarter());

    $('#month-year-from').val(filterDates.calendar.last.start.format('YYYY'));
    $('#month-year-to').val(filterDates.calendar.last.end.format('YYYY'));
    $('#month-month-from').val(filterDates.calendar.last.start.format('MM'));
    $('#month-month-to').val(filterDates.calendar.last.end.format('MM'));

    $('#week-year-from').val(filterDates.calendar.last.start.format('YYYY')).change();
    $('#week-year-to').val(filterDates.calendar.last.end.format('YYYY')).change();
    $('#week-week-from').val('1');
    $('#week-week-to').val('52');

    $('#day-year-from').val(filterDates.calendar.last.start.format('YYYY'));
    $('#day-year-to').val(filterDates.calendar.last.end.format('YYYY'));
    $('#day-month-from').val(filterDates.calendar.last.start.format('MM'));
    $('#day-month-to').val(filterDates.calendar.last.end.format('MM'));
    $('#day-day-from').val(filterDates.calendar.last.start.format('DD'));
    $('#day-day-to').val(filterDates.calendar.last.end.format('DD'));
}

function getData(request, callback) {
    $.ajax({
        type: 'POST',
        url: 'data/data.php',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            pillar: 'raw',
            request: request,
            database: 'aesop',
            interval: ''
        }),
        success: function (data) {
            callback(data);
            resizeElements();
        },
        error: function (error) {
            console.error(error);
        }
    });
}

function getNetSuiteData(table, callback) {
    $.ajax({
        type: 'POST',
        url: 'data/data.php',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            pillar: 'raw',
            request: table,
            database: 'aesop_kpi'
        }),
        success: function (data) {
            callback(data);
        },
        error: function (error) {
            console.error(error);
        }
    });
}

var dataLoadingStatus,
    allDataLoadedCallback;

function loadingKPIs(event, response) {
    switch (event) {
        case 'reset':
            dataLoadingStatus = {
                queued: 0,
                success: 0,
                errors: 0,
                errorMessages: []
            };
            $('#filter-refresh').button('loading');
            $('.onoffswitch-checkbox').prop('disabled', true);
            $('#currency_dropdown, #currency_dropdown > .dropdown-toggle').addClass('disabled');
            $('.content > div[id].done, .content > a > div[id].done', '.card').removeClass('done');

            $('.card').has('.highcharts-container, .dataTables_scrollBody, #pandl_table').addClass('loading');

            updateProgress(0);

            return;
        case 'loading':
            dataLoadingStatus.queued++;
            break;
        case 'loaded':
            dataLoadingStatus.success++;
            updateProgress((dataLoadingStatus.success + dataLoadingStatus.errors) / dataLoadingStatus.queued * 100);
            resizeElements();
            break;
        case 'error':
            var $jqXHR = $(response.jqXHR.responseText);
            var $header = $('h2, th', $jqXHR);
            if ($header.length)
                response.header = $header.first().text();
            var $body = $('h3', $jqXHR);
            if ($body.length)
                response.body = $body.first().text();

            dataLoadingStatus.errors++;
            dataLoadingStatus.errorMessages.push(response);
            updateProgress((dataLoadingStatus.success + dataLoadingStatus.errors) / dataLoadingStatus.queued * 100);
            console.error(response);
            break;
    }
    if (dataLoadingStatus.queued == (dataLoadingStatus.success + dataLoadingStatus.errors)) {
        $('#filter-refresh').button('reset');
        $('.onoffswitch-checkbox').prop('disabled', false);
        $('#currency_dropdown, #currency_dropdown > .dropdown-toggle').removeClass('disabled');
        $('.content > div[id]:not(.dataTables_wrapper), .content > a > div[id]:not(.dataTables_wrapper)', '.card').addClass('done');

        $('.card.loading').removeClass('loading');
        updateProgress(100);

        if (typeof allDataLoadedCallback === 'function')
            allDataLoadedCallback();

        /* Display Errors in Modal */
        /*if (dataLoadingStatus.errors) {
          $('#messageModal').modal('show');
          $('#modalTitle').html(
              '<span style="color:red;font-size:14px;font-weight:400;">' +
              '<i class="fa fa-exclamation-circle" aria-hidden="true"></i>' +
              'error' + (dataLoadingStatus.errors == 1 ? '' : 's') +
              '</span>'
          );
          $('#modalBody').html(
              '<span style="font-size:14px;">' +
              $.map(dataLoadingStatus.errorMessages, function (value) {
                return 'Request: ' + value.request + '<br/>' + value.error;
              }).join('<br/><br/>') +
              '</span>'
          );
        }*/
    }
}


function exportButton() {
    var $export = $('#btn-export');
    $export.replaceWith($('.dt-buttons > .buttons-csv').html($export.html()));
}


String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function (string) {
        return string.charAt(0).toUpperCase() + string.substr(1).toLowerCase();
    });
};


var colors = [
    '#000000',
    '#bf9000',
    '#535c50',
    '#254672',
    '#3d1700',
    '#d1b469',
    '#778373',
    '#0033a8',
    '#992600',
    '#595959',
    '#a0a69a',
    '#8e9aab',
    '#da9663'
];

function getColor() {
    colors.push(colors.shift());
    return colors[0];
}

function shadeColor(color, percent) {
    var f = parseInt(color.slice(1), 16),
        t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent * -1 : percent,
        R = f >> 16,
        G = f >> 8 & 0x00FF,
        B = f & 0x0000FF;
    return '#' + (0x1000000 +
        (Math.round((t - R) * p) + R) * 0x10000 +
        (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

$.fn.removeSearchableOptionList = function () {
    var elem = $(this),
        solContainer = elem.prev('.sol-container');
    if (solContainer.length) {
        elem = elem.clone();
        $(this).replaceWith(elem.attr('name',
            $('.sol-label > input', solContainer).first().attr('name') || elem.data('name')
        ));
        solContainer.remove();
    }
    return elem;
};

function dataTablesCustomSort(index) {
    return '<span class="dataTables-custom-sort">[[' + ('0000000' + index).slice(-8) + ']]</span>';
}

function isProfitability() {
    return ($_GET.m || '').contains('profitability');
}

function solOpen(sol) {
    var $checkedInputs = $('.sol-label > input:checked', sol.$selection);
    if ($checkedInputs.length)
        sol.$selection.scrollTop($checkedInputs.first().parent().parent().position().top - 50);
}

$('.wrapper > .row.filter').parent('.wrapper').attr('id', 'filter-container');


$('html').append('<div id="progress"></div><div id="percent"></div>');

Object.keys($_GET).forEach(function (key) {
    $('html').attr('data-' + key, $_GET[key]);
});

var progressInterval;
// var percentInterval;
var progressPercent = 0;

function startStopProgressInterval(toggle) {
    if (toggle)
        progressInterval = setInterval(function () {
            updateProgress(progressPercent + 0.5);
        }, 300);
    else
        clearInterval(progressInterval);
}

/*function startStopPercentInterval(toggle) {
  if (toggle)
    percentInterval = setInterval(function () {
      var percent = (100 - ($('#progress').width() / window.innerWidth * 100)).toFixed(0);
      $('#percent').attr('data-value', percent);
      if (percent == 100) startStopPercentInterval(false)
    }, 0);
  else
    clearInterval(percentInterval);
}*/

function updateProgress(percent) {
    var isZero = percent === 0;
    if (percent > progressPercent || isZero) {
        progressPercent = percent;
        // if (isZero) startStopPercentInterval(true);
        if (!isZero) startStopProgressInterval(false);

        $('#progress').toggleClass('zero', isZero).css('width', (100 - percent) + '%');

        if (percent < 90) startStopProgressInterval(true);
    }
}

$('.card').has(
    $('.card > .header > h4.title > span.pull-right').not(':has(.loading-indicator)').prepend(
        '<a class="loading-indicator"><i class="fa fa-spinner fa-pulse" aria-hidden="true"></i></a>'
    )
).addClass('loading');

function cardDoneLoading($elem) {
    resizeElements();
    return $('.card').has($elem).removeClass('loading');
}

$(document).on('init.dt draw.dt', function (e, settings) {
    var api = new $.fn.dataTable.Api(settings);
    var tableContainer = api.table().container();
    var $card = cardDoneLoading(tableContainer);
    $('.dataTables_info', tableContainer).attr('data-text', $('.dataTables_info', tableContainer).text());


    var filter = JSON.parse(localStorage.getItem(PILLAR_FILTER_NAME));

    var $exportButton = $('a.dt-button.buttons-csv.buttons-html5', $card);
    var cardTitle = $('.header > .title', $card).text().trim();
    var pageTitle = pageHeaders[0] + ' - ' + ($('.nav > li.active').length ? pageHeaders[1] + ' - ' : '');
    var intervalRange = formatFilterDateRange(filter);
    var intervalRangeFilename = formatFilterDateRange(filter, 'filename');

    $exportButton.attr({
        title: pageTitle + cardTitle + ' (' + intervalRangeFilename + ').csv',
        'data-csv-header': pageTitle.replace(/ē/, 'e') + cardTitle + '|' + intervalRange
    });


    return false; // todo: Leave up/down indicators out until further notice
    if ($('.dataTables_scrollBody', tableContainer).text().contains('%'))
        api.table().rows().every(function () {
            var self = this;
            self.data().forEach(function (value, colIndex) {
                if (typeof value == 'string' && value.contains('%')) {
                    var intValue = unFormatInt(value);
                    if (!isNaN(intValue)) {
                        var $cell = $('td:nth-child(' + (colIndex + 1) + ')', self.node());
                        if (intValue > 0)
                            $cell.addClass('text-percent-positive');
                        else if (intValue < 0)
                            $cell.addClass('text-percent-negative').text(value.replace('-', '')).attr('data-value', value);
                    }
                }
            });
        });
}).on('click', '.loading-indicator', function () {
    return false;
});

// DataTables Defaults
$.extend($.fn.dataTable.defaults, {
    buttons: [{
        extend: 'csvHtml5',
        bom: true,
        title: '',
        // footer: true,
        customize: function (data, button) {
            var $exportButton = $('.card > .header > .title > .pull-right > a.dt-button.buttons-csv.buttons-html5');

            // can be refactor start (if there are more one csv export button)
            if (data.slice(1, 13) == 'exportTable=') {
                var position = data.indexOf("|");
                var table = data.slice(13, position);
                data = '"' + data.slice(position + 1);
                if (table == 'productByStore') {
                    $exportButton = $('.product-by-store > .header > .title > .pull-right > a.dt-button.buttons-csv.buttons-html5');
                }
                if (table == 'productLeadboard') {
                    $exportButton = $('.product-leadboard > .header > .title > .pull-right > a.dt-button.buttons-csv.buttons-html5');
                }
                if (table == 'trafficConversion') {
                    $exportButton = $('.traffic-conversion > .header > .title > .pull-right > a.dt-button.buttons-csv.buttons-html5');
                }
                if (table == 'donationByStore') {
                    $exportButton = $('.donation-by-store > .header > .title > .pull-right > a.dt-button.buttons-csv.buttons-html5');
                }
                if (table == 'donationByCountry') {
                    $exportButton = $('.donation-by-country > .header > .title > .pull-right > a.dt-button.buttons-csv.buttons-html5');
                }
            }
            // can be refactor end

            button.title = $exportButton.attr('title').replace(/\.csv$/, '');
            var csvHeader = $exportButton.attr('data-csv-header').replace('|', '"\n"');
            return '"' + csvHeader + '"\n\n' + data.replace(/\[\[\d{8,}]]/gm, '').replace(/ - \|\|/gm, '","');
        },
        exportOptions: {
            columns: ':visible'
        }
    }]
});

// Highcharts Defaults
Highcharts.setOptions({
    lang: {
        thousandsSep: ',',
        contextButtonTitle: null,
        printChart: 'Print',
        downloadPNG: 'PNG',
        downloadJPEG: 'JPEG',
        downloadPDF: 'PDF',
        downloadSVG: 'SVG'
    },
    title: {text: null},
    subtitle: {text: null},
    credits: {enabled: false},
    legend: {
        enabled: true,
        padding: 15
    },
    chart: {
        spacing: [10, 8, 0, 8],
        backgroundColor: 'transparent',
        style: {
            fontFamily: '"SuisseIntl Medium","Helvetica Neue",Helvetica,Arial,sans-serif'
        },
        events: {
            render: function () {
                cardDoneLoading(this.container);
            },
            beforePrint: function () {
                $('.card').has(this.container).addClass('printing');
                var userWidth = this.chartWidth;
                var userHeight = this.chartHeight;
                if (
                    (this.userOptions.chart.hasOwnProperty('width') &&
                        this.userOptions.chart.width.contains('%')) ||
                    (this.userOptions.chart.hasOwnProperty('height') &&
                        this.userOptions.chart.height.contains('%'))
                ) {
                    userWidth = this.userOptions.chart.width;
                    userHeight = this.userOptions.chart.height;
                }
                this.old = {
                    actualSize: {
                        width: this.chartWidth,
                        height: this.chartHeight
                    },
                    userSize: {
                        width: userWidth,
                        height: userHeight
                    },
                    documentTitle: document.title
                };
                var exporting = this.options.exporting;
                this.setSize(exporting.printSize.width, exporting.printSize.height, false);
                this.update({exporting: {enabled: false}});

                var printHeaders = pageHeaders;
                if (!printHeaders.contains(exporting.chartOptions.title.text))
                    printHeaders.push(exporting.chartOptions.title.text);
                printHeaders.push(exporting.chartOptions.subtitle.text);
                document.title = printHeaders.join(' - ');
            },
            afterPrint: function () {
                document.title = this.old.documentTitle;
                var update = {exporting: {enabled: true}};
                if (isNullOrEmpty(resizeElements())) {
                    this.setSize(this.old.actualSize.width, this.old.actualSize.height, false);
                    update.chart = this.old.userSize;
                }
                this.update(update);
                $('.card').has(this.container).removeClass('printing');
            }
        }
    },
    plotOptions: {
        line: {
            marker: {
                symbol: 'circle',
                radius: 3
            }
        }
    },
    navigation: {
        menuStyle: {
            border: '1px solid rgba(0, 0, 0, .15)',
            padding: '0',
            'box-shadow': '-2px 6px 12px rgba(0, 0, 0, .175)',
            'border-radius': '2px'
        },
        menuItemStyle: {
            color: '#333333',
            transition: 'none',
            padding: '6px 14px 6px 10px'
        },
        menuItemHoverStyle: {
            color: '#333333',
            background: '#F5F5F5'
        }
    },
    exporting: {
        enabled: true,
        scale: 3,
        printSize: { // Nonstandard properties
            width: 700,
            height: 500
        },
        buttons: {
            contextButton: {
                symbol: null,
                text: '\uf01a',
                symbolSize: 16,
                symbolStrokeWidth: 1,
                symbolStroke: '#232323',
                symbolFill: 'transparent',
                verticalAlign: 'bottom',
                x: 0,
                y: -6,
                theme: {
                    fill: 'transparent',
                    padding: 0,
                    style: {
                        color: '#6b6b6b',
                        fontSize: '19px'
                    },
                    states: {
                        hover: {
                            fill: 'transparent',
                            style: {
                                color: '#232323',
                                fontWeight: 'normal'
                            }
                        },
                        select: {
                            fill: 'transparent',
                            style: {
                                color: '#232323',
                                fontWeight: 'normal',
                                cursor: 'default'
                            }
                        }
                    }
                },
                menuItems: [
                    'printChart',
                    'separator',
                    'downloadPNG',
                    'downloadJPEG',
                    'downloadPDF',
                    'downloadSVG'
                ]
            }
        },
        chartOptions: {
            plotOptions: {
                series: {
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:,.1f}'
                    }
                }
            }
        }
    }
});

var dateFormats = {
    default: {
        year: 'YYYY',
        quarter: '[Q]Q (YYYY)',
        month: 'MMM YYYY',
        week: '[WK]w (YYYY)',
        day: 'DD/MM/YYYY'
    },
    filename: {
        year: 'YYYY',
        quarter: 'YYYY [Q]Q',
        month: 'YYYY-MM',
        week: 'YYYY [WK]w',
        day: 'YYYY-MM-DD'
    }
};

function formatFilterDateRange(filter, type) {
    type = isNullOrEmpty(type) ? 'default' : type;

    if (isNullOrEmpty(filter))
        return moment().format(dateFormats[type].day);

    return moment(filter.start_date).format(dateFormats[type][filter.interval]) +
        ' - ' +
        moment(filter.end_date).format(dateFormats[type][filter.interval]);
}

function formatChartForExport(chartRaw, filter) {
    if (chartRaw.hasOwnProperty('exporting')) {
        if (chartRaw.exporting.hasOwnProperty('enabled') && chartRaw.exporting.enabled === false)
            return;
    } else {
        chartRaw.exporting = {};
    }

    var $cards = $('.card');
    var $card = $cards.has($('#' + chartRaw.chart.renderTo));
    var cardTitle = $('.header > .title', $card).text().trim();
    var pageTitle = pageHeaders[0] + ' - ' + ($('.nav > li.active').length ? pageHeaders[1] + ' - ' : '');
    var intervalRange = formatFilterDateRange(filter);
    var intervalRangeFilename = formatFilterDateRange(filter, 'filename');

    chartRaw.exporting.filename = pageTitle + cardTitle + ' (' + intervalRangeFilename + ')';
    chartRaw.exporting.chartOptions = {
        title: {
            text: cardTitle
        },
        subtitle: {
            text: intervalRange
        }
    };

    if (!chartRaw.hasOwnProperty('lang'))
        chartRaw.lang = {};
    if (!chartRaw.lang.hasOwnProperty('contextButtonTitle'))
        chartRaw.lang.contextButtonTitle = chartRaw.exporting.filename;

    if ($cards.length == 1) {
        var chartDimensions = resizeElements($card);
        if (!isNullOrEmpty(chartDimensions)) {
            chartRaw.chart.width = chartDimensions.width;
            chartRaw.chart.height = chartDimensions.height;
        }
    }
}


/* Extend DataTables to add footers with column totals */
(function ($) {
    var DataTableOrg = $.fn.DataTable;

    $.fn.DataTable = function (options) {
        if (typeof options === 'object') {
            if (options.footerTotals && $.isArray(options.footerTotals) && options.columns.length) {
                $(this).append('<tfoot><tr>' + Array(options.columns.length + 1).join('<th></th>') + '</tr></tfoot>');
                options = $.extend(true, options, {
                    footerCallback: function (tfoot, data, start, end, display) {
                        var api = this.api();

                        var totalData = [];
                        var totalDisplay = [];
                        var defaultDecimals = 0;
                        var defaultFormat = '{n}';
                        var lastRowNumber = display.length - 1;
                        var colNum, colNumIdx = 0;
                        options.footerTotals.forEach(function (colTotalOpt) {
                            if (typeof colTotalOpt === 'number' && colTotalOpt < options.columns.length && colTotalOpt >= 0) {
                                colNum = colTotalOpt;
                                totalData[colNum] = {
                                    total: 0,
                                    decimals: defaultDecimals,
                                    format: defaultFormat
                                };
                                totalDisplay[colNum] = colNum;
                            }
                            else if ($.isArray(colTotalOpt) && colTotalOpt.length) {
                                colNumIdx = 0;
                                colTotalOpt.forEach(function (optItem) {
                                    if (typeof optItem === 'number' && optItem < options.columns.length && optItem >= 0) {
                                        if (colNumIdx == 0) {
                                            colNum = optItem; // remember the colNum as it's the first OptArray
                                            if (totalDisplay.indexOf(colNum) !== colNum) {
                                                totalDisplay[colNum] = [];
                                            }
                                        }
                                        totalData[optItem] = {
                                            total: 0,
                                            decimals: defaultDecimals,
                                            format: defaultFormat
                                        };
                                        if (totalDisplay.indexOf(colNum) !== colNum) {
                                            totalDisplay[colNum][colNumIdx] = optItem;
                                        }
                                        colNumIdx++;
                                    }
                                    else
                                        totalDisplay[colNum][colNumIdx] = optItem;
                                });
                            }
                        });
                        // Calculate Total
                        display.forEach(function (rowNum, displayIndex) {
                            for (colNum = 0; colNum < totalData.length; colNum++) {
                                if (typeof totalData[colNum] !== 'object') {
                                    continue;
                                }
                                var cellValue = data[rowNum][colNum];

                                if (typeof cellValue == 'number')
                                    cellValue = cellValue.toString();

                                if (displayIndex == 0) {
                                    totalData[colNum].decimals = cellValue.contains('.') ?
                                        cellValue.split('.')[1].replace('%', '').length :
                                        defaultDecimals;
                                    totalData[colNum].format = cellValue.match(/^-?\$/g) ?
                                        '$' + defaultFormat :
                                        (cellValue.match(/%$/g) ? defaultFormat + '%' : defaultFormat);
                                }

                                totalData[colNum].total += unFormatInt(cellValue);

                                // if (displayIndex >= lastRowNumber)
                            }
                        });

                        // Display Total
                        for (colNum = 0; colNum < totalDisplay.length; colNum++) {
                            if (typeof totalDisplay[colNum] === 'number') {
                                $(api.column(colNum).footer()).html(
                                    formatInt(
                                        totalData[colNum].total,
                                        totalData[colNum].decimals,
                                        totalData[colNum].format
                                    )
                                );
                            }
                            else if ($.isArray(totalDisplay[colNum]) && totalDisplay[colNum].length) {
                                if (colNum !== totalDisplay[colNum][0]) {
                                    continue;
                                }

                                var totalValue = totalData[colNum].total;
                                if (totalDisplay[colNum].length > 1) {
                                    totalValue = totalData[totalDisplay[colNum][1]].total;
                                }

                                if (totalDisplay[colNum].length > 2) {
                                    if (totalData[totalDisplay[colNum][2]].total == 0)
                                        totalValue = 0;
                                    else
                                        totalValue = 100 * totalValue / totalData[totalDisplay[colNum][2]].total - 100;
                                }

                                if (typeof totalDisplay[colNum] === 'object') {
                                    // A/B
                                    if (totalDisplay[colNum][totalDisplay[colNum].length - 1] === 'A') {
                                        if (totalData[totalDisplay[colNum][2]].total == 0)
                                            totalValue = 0;
                                        else
                                            totalValue = totalData[totalDisplay[colNum][1]].total / totalData[totalDisplay[colNum][2]].total;
                                    }

                                    // A/B*100
                                    if (totalDisplay[colNum][totalDisplay[colNum].length - 1] === 'B') {
                                        if (totalData[totalDisplay[colNum][2]].total == 0)
                                            totalValue = 0;
                                        else
                                            totalValue = totalData[totalDisplay[colNum][1]].total / totalData[totalDisplay[colNum][2]].total * 100;
                                    }

                                    // calculate YOY % (from two percent value)
                                    if (totalDisplay[colNum][totalDisplay[colNum].length - 1] === 'C') {
                                        if (totalData[totalDisplay[colNum][2]].total == 0)
                                            var totalPercent1 = 0;
                                        else
                                            var totalPercent1 = totalData[totalDisplay[colNum][1]].total / totalData[totalDisplay[colNum][2]].total;

                                        if (totalData[totalDisplay[colNum][4]].total == 0)
                                            var totalPercent2 = 0;
                                        else
                                            var totalPercent2 = totalData[totalDisplay[colNum][3]].total / totalData[totalDisplay[colNum][4]].total;

                                        if (totalPercent2 == 0)
                                            var totalValue = 0;
                                        else
                                            var totalValue = totalPercent1 / totalPercent2 * 100 - 100;
                                    }

                                    if (totalDisplay[colNum][totalDisplay[colNum].length - 1] === 'D') {
                                        if (totalData[totalDisplay[colNum][1]].total == 0)
                                            totalValue = 0;
                                        else
                                            totalValue = 100 - totalData[totalDisplay[colNum][2]].total / totalData[totalDisplay[colNum][3]].total * 100;
                                    }

                                    // only for calculation of Conversion
                                    if (totalDisplay[colNum][totalDisplay[colNum].length - 1] === 'E') {
                                        for (var transRow = 0; transRow < lastRowNumber; transRow++) {
                                            if (data[transRow][totalDisplay[colNum][2]] == 0)
                                                totalData[totalDisplay[colNum][1]].total -= data[transRow][totalDisplay[colNum][1]];
                                        }

                                        if (totalData[totalDisplay[colNum][2]].total == 0)
                                            totalValue = 0;
                                        else
                                            totalValue = totalData[totalDisplay[colNum][1]].total / totalData[totalDisplay[colNum][2]].total * 100;
                                    }

                                    // A - B
                                    if (totalDisplay[colNum][totalDisplay[colNum].length - 1] === 'F') {
                                        totalValue = totalData[totalDisplay[colNum][0]].total - totalData[totalDisplay[colNum][1]].total;
                                    }
                                    if (totalDisplay[colNum][totalDisplay[colNum].length - 1] === 'G') {
                                        totalValue = totalData[totalDisplay[colNum][1]].total - totalData[totalDisplay[colNum][2]].total;
                                    }
                                    // calculate yoy
                                    if (totalDisplay[colNum][totalDisplay[colNum].length - 1] === 'H') {

                                        if (totalData[totalDisplay[colNum][2]].total == 0) {
                                            totalValue = 0;
                                        } else {
                                            totalValue = (totalData[totalDisplay[colNum][1]].total / totalData[totalDisplay[colNum][2]].total) * 100 - 100;
                                        }
                                    }
                                    // -calculate yoy
                                    if (totalDisplay[colNum][totalDisplay[colNum].length - 1] === 'I') {

                                        if (totalData[totalDisplay[colNum][2]].total == 0) {
                                            totalValue = 0;
                                        } else {
                                            totalValue = 100 - (totalData[totalDisplay[colNum][1]].total / totalData[totalDisplay[colNum][2]].total) * 100
                                        }
                                    }

                                  if (totalDisplay[colNum][totalDisplay[colNum].length - 1] === 'J') {
                                    if (totalData[totalDisplay[colNum][2]].total == 0 || totalData[totalDisplay[colNum][3]].total == 0 || totalData[totalDisplay[colNum][4]].total == 0)
                                      totalValue = 0;
                                    else
                                      totalValue = (totalData[totalDisplay[colNum][1]].total / totalData[totalDisplay[colNum][2]].total)/ (totalData[totalDisplay[colNum][3]].total / totalData[totalDisplay[colNum][4]].total)*100 -100;

                                  }

                                }

                                $(api.column(colNum).footer()).html(
                                    formatInt(
                                        totalValue,
                                        totalData[colNum].decimals,
                                        totalData[colNum].format
                                    )
                                );
                            }
                        }
                    }
                });
            }
        }
        var args = Array.prototype.slice.call(arguments, 0);
        return DataTableOrg.apply(this, args);
    }

})(jQuery);

function sortObjectArrayByKey(data, key, reverse) {
    var output = data.sort(function (a, b) {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
        return 0;
    });
    if (reverse) output.reverse();
    return output;
}

function getXAxisFromMonthYear(callbackData, filter, ly) {
    return $.map(callbackData, function (data) {
        return getColumnFromMonthYear(data, filter, ly);
    });
}

function getColumnFromMonthYear(data, filter, ly) {
    if (ly) data.year++;
    switch (filter.interval) {
        case 'month':
            // return moment(data.month_no + '/' + data.year, 'M/YYYY').format(dateFormats.default.month);
            var month = moment(data.month_no + '/' + data.year, 'M/YYYY').format('MMM');
            var year = moment(data.month_no + '/' + data.year, 'M/YYYY').format('YYYY');
            return month + '  ' + year;
        case 'quarter':
            // return data.cal_qtr + ' (' + data.year + ')';
            return data.cal_qtr + ' (' + data.year + ')';
        case 'year':
            return data.year;
        case 'week':
            var m = moment(data.week_ending, 'YYYY-MM-DD');
            return 'WK' + (m.week() - 1) + ' (' + m.year() + ')';
        case 'day':
            var date = moment(data.yyyymmdd, 'YYYYMMDD').add(ly ? 1 : 0, 'year').format(dateFormats.default.day);
            var day = $_GET.m.contains('_interval') ? ' - ' + moment(data.yyyymmdd, 'YYYYMMDD').add(ly ? 1 : 0, 'year').format('[<span class="dataTables-export-delimiter">||</span>]ddd') : '';
            return date + day;

    }
}

function calculateYOY(sales, salesLy) {
    if (!(sales > 0) || !(salesLy > 0)) return 0;
    var yoy = parseFloat((((sales / salesLy) - 1) * 100).toFixed(1));
    return isNaN(yoy) ? 0 : yoy;
}

function showKpiData(callback) {
    $('#kpi_data').append('<h4>' + callback.request + '</h4><pre>' + JSON.stringify(callback.data, null, 2) + '</pre>');
    console.log(callback);
}

function isMobile() {
    return window.innerWidth < 992;
}

function resizeElements($card) {
    var output = null;
    if (!$._data(window, 'events').hasOwnProperty('resize'))
        $(window).on('resize', resizeElements);

    if (isNullOrEmpty($card) || !($card instanceof jQuery) || !$card.hasClass('card'))
        $card = $('.card');

    var oneCard = $card.length == 1;
    if (oneCard) {
        if ($('.dataTables_wrapper', $card).length == 1) {
            if (isMobile()) return;

            var tableOffsetTop = $('.dataTables_wrapper .dataTables_scrollBody', $card).offset().top;
            if (!$card.hasClass('card-only') || tableOffsetTop != oldTableOffsetTop) {
                oldTableOffsetTop = tableOffsetTop;
                $('.dataTables_wrapper', $card.addClass('card-only')).each(function () {
                    $('.dataTables_scrollBody', this).css('height',
                        'calc(100vh - ' + (
                            tableOffsetTop +
                            ($('.dataTables_scrollFoot', this).length ?
                                $('.dataTables_scrollFoot', this).outerHeight()
                                : 0) +
                            ($('.dataTables_info', this).length ?
                                $('.dataTables_info', this).outerHeight() +
                                parseInt($('.dataTables_info', this).css('margin-top'))
                                : 0) +
                            parseInt($card.css('border-bottom-width')) +
                            parseInt($card.css('margin-bottom')) +
                            parseInt($('.content', $card).css('padding-bottom'))
                        ) + 'px)'
                    );
                });
                setTimeout(function () {
                    if (($('.header', $card).outerHeight() + $('.content', $card).outerHeight()) !== $card.innerHeight())
                        resizeElements();
                }, 1);
            }

            var tableObj = $('table.dataTable', $card).DataTable();
            if (tableObj.page() == 0) {
                var newPageLen = Math.floor(($('.dataTables_scrollBody', $card).innerHeight() - 10) / 32);
                if (tableObj.page.len() !== newPageLen)
                    tableObj.page.len(newPageLen).draw();
            }
        } else {
            var chartWidth = $('.content', $card).width(),
                chartHeight = window.innerHeight -
                    $('.content', $card).offset().top -
                    parseInt($card.css('border-bottom-width')) -
                    parseInt($card.css('margin-bottom')) -
                    parseInt($('.content', $card).css('padding-top')) -
                    parseInt($('.content', $card).css('padding-bottom'));

            output = {width: chartWidth, height: chartHeight};
            var $chart = $('[data-highcharts-chart]:not([data-chart-size="' + chartWidth + ',' + chartHeight + '"])', $card);
            if ($chart.length == 1) {
                output.$chart = $chart.attr('data-chart-size', chartWidth + ',' + chartHeight);
                output.chart = Highcharts.charts[$chart.attr('data-highcharts-chart')];
                output.chart.setSize(chartWidth, chartHeight, false);
            }
        }
    }

    if (!pageHeaders.length) {
        var $title = $('.title', $card);
        pageHeaders = [documentTitle];
        if ($('.nav li.active', '.sidebar-wrapper').length == 1)
            pageHeaders.push($('.nav li.active', '.sidebar-wrapper').text().trim());
        if (oneCard && $title.length == 1 && $title.text().trim().length)
            pageHeaders.push($title.text().trim());
        document.title = pageHeaders.join(' - ');
    }
    return output;
}

$(function () {
    $('h5', '.accordion').on('click', function () {
        $(this).toggleClass('active').next().slideToggle();
    });

    $('#filter-years').multiselect();

    $(window).on('resize load', resizeElements);
    resizeElements();
});


function replaceUrl(url) {
    history.replaceState(null, null, url);
}