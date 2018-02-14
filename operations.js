

function isEmpty( el ){
  return !$.trim(el.html())
}

function contactRendered(contact) {
  var isRendered = false;
  var $renderedContacts = $contactsContainer.find('input[type=hidden]');
  $renderedContacts.each(function() {
    if(Number($(this).val()) === +contact.id) {
      isRendered = true;
    }
  });
  return isRendered;
}

function Contact(name, email, phone, tags, id) {
  this.name = name || '';
  this.email = email || '';
  this.phone = phone || '';
  this.id = id;
  this.tags = tags || [];
} 

/* Contacts Object */

function ContactsObject() {
  this.contactsCollection = [];
  this.lastId = 0;
}

ContactsObject.prototype = {
  makeContact: function(name, email, phone, tags, id) {
    console.log(this.lastId);
    var contact = new Contact('', '', '', '', this.lastId);
    this.lastId++;
    this.contactsCollection.push(contact);

    return contact;
  },
  removeFromCollection: function(id) {
    var idx;

    this.contactsCollection.forEach(function(obj, index) {
      if (obj.id === id) {
        idx = index;
        return;
      }
    });

    this.contactsCollection.splice(idx, 1);
  },
}

/* Events Obejct*/

function Manager() {
  this.contactsObject = new ContactsObject;
  this.tagCollection = [];
  this.curContact = '';
  this.init();
}

Manager.prototype = {
  filterContacts: function(event) {
    var query = new RegExp($searchInput.val(), 'i'),
        $controlTags = $('.tags-control input[type=checkbox]:checked'),
        $renderedContacts = $contactsContainer.find('.contact');
        controlTagsArray = [],
        searchFilteredArray = [],
        tempArray = [];

    $controlTags.each(function() {
      controlTagsArray.push($(this).val());
    });

    this.contactsObject.contactsCollection.forEach(function(contact) {
      if (contact.name.match(query)) {
        searchFilteredArray.push(contact);
      }
    });

    controlTagsArray.forEach(function(controlTag) {
      searchFilteredArray.forEach(function(contact) {
        if (($.inArray(String(controlTag), contact.tags)) !== -1) {
          tempArray.push(contact);
        }
      });
      searchFilteredArray = tempArray;
      tempArray = [];
    });

    $renderedContacts.hide();

    searchFilteredArray.forEach(function(contact) {
      $renderedContacts.each(function() {
        var $curRenderedContact = $(this);

        if (Number(contact.id) === Number($curRenderedContact.find('input[type=hidden]').val())) {
          $curRenderedContact.show();
        }

      });
    }.bind(this));
  },
  deleteContact: function(event) {
    event.preventDefault();
    var id = Number(this.findId(event)),
        $parent = this.findRenderedContact(id),
        idx;

    this.contactsObject.removeFromCollection(id);

    $parent.remove();

    if (isEmpty($('#contacts-container'))) {
      $('.no-contacts').show();
    }
  },
  editContact: function(event) {
    event.preventDefault();
    var id = Number(this.findId(event));

    this.curContact = this.contactsObject.contactsCollection.filter(function(obj) {
       return obj.id === id;
    }).pop();

    this.showForm();
  },
  cancelContact(event) {
    event.preventDefault();

    if(!(contactRendered(this.curContact))) {
      this.contactsObject.removeFromCollection(this.curContact.id);
    }

    this.formDone();
  },
  findRenderedContact: function(id) {
    var $input = $('input[type=hidden]').filter(function() {
      return Number($(this).val()) === id;
    });

    return $input.closest('li');
  },
  findId: function(event) {
    var $parent = $(event.target).closest('li');
    return $parent.find('input[type=hidden]').val();
  },
  displayContact: function(contact) {
    var contactHTML = contactScript(contact);

    if (contactRendered(contact)) {
      $parent = this.findRenderedContact(contact.id);
      $parent.html(partialContactScript(contact));
    } else {
      $contactsContainer.append(contactHTML);
    }
  },
  renderContact: function() {
      var contact = this.curContact,
          $parent;

      contact.name = $('input[name^=full-name]').val();
      contact.email = $('input[name^=email]').val();
      contact.phone = $('input[name^=phone]').val();

      $('#contact-form').find('input[type=checkbox]:checked').each(function() {
        contact.tags.push($(this).val());
      });

      contact.tagObjs = contact.tags.map(function(newTag) {
        return {tag: newTag};
      });

      this.displayContact(contact);
      
      this.formDone();
    },
  newContact: function(event) {
      event.preventDefault(); 
      this.renderContact();
    },
  showForm: function() {
      var contact = this.curContact;       

      $well.hide();
      $noContacts.hide();
      $contactsContainer.hide();
      $contactForm.show();

      $('input[name^=full-name]').val(contact.name); 
      $('input[name^=email]').val(contact.email);
      $('input[name^=phone]').val(contact.phone);
    },
    formDone() {
      document.getElementById('contact-form').reset();
      $contactForm.hide();
      $contactsContainer.show();
      $well.show();
      if (isEmpty($('#contacts-container'))) {
        $('.no-contacts').show();
      }
    },
  processContact: function(event) {
      event.preventDefault()
      var contact = this.contactsObject.makeContact();
      this.curContact = contact;
      this.showForm();
    },
  renderTags: function() {
      var tagsObjectArray = this.tagCollection.map(function(newTag) {
        return {tag: newTag};
      }.bind(this));

      $('.tags dd').html('');
      $('.tags dd').append(tagScript({tags: tagsObjectArray}));
    },
  newTag: function(event) {
      event.preventDefault();
      var tagsArray = this.tagCollection;

      if($tagInput.val() !== '') {
        tagsArray.push($tagInput.val());
        $tagInput.val('');
      }

      this.renderTags();
    },
  registerTemplates: function() {
    tagTemplate = $('#tags').html(),
    tagScript = Handlebars.compile(tagTemplate),
    tagsToRenderTemplate = $('#tagsToRender').html();

    Handlebars.registerPartial('tagsPartial', tagsToRenderTemplate);

    contactContent = $('#contactContent').html();
    partialContactScript = Handlebars.compile(contactContent);

    Handlebars.registerPartial('contactContentPartial', contactContent);

    contactTemplate = $('#contact').html(),
    contactScript = Handlebars.compile(contactTemplate);
  },
  registerDOMElements: function() {
    $contactsContainer = $('#contacts-container'),
    $contactForm = $('.form'),
    $noContacts = $('.no-contacts'),
    $well = $('.well'),
    $contactBtn = $('.add-contact'),
    $submitBtn = $('.submit-button'),
    $cancelBtn = $('#cancel'),
    $tagBtn = $('.add-tag'),
    $tagInput = $('.tag-input'),
    $searchInput = $('.contact-name-search');
  },
  bindEvents: function() {
    $contactBtn.on('click', this.processContact.bind(this));
    $submitBtn.on('click', this.newContact.bind(this));
    $cancelBtn.on('click', this.cancelContact.bind(this));
    $contactsContainer.on('click', '.edit-contact', this.editContact.bind(this));
    $contactsContainer.on('click', '.delete-contact', this.deleteContact.bind(this));
    $tagBtn.on('click', this.newTag.bind(this));
    $searchInput.on('input', this.filterContacts.bind(this));
    $('.tags-control').on('change', 'input[type=checkbox]', this.filterContacts.bind(this));
    $(window).on('unload', this.storeData.bind(this));
  },
  init: function() {
    this.registerDOMElements();
    this.registerTemplates();
    this.bindEvents();
    this.renderStoredData();

    if (isEmpty($('#contacts-container'))) {
        $('.no-contacts').show();
      }
  },
  storeData: function(event) {

    if ($('.form:visible')) {
      this.cancelContact();
    }
    var collecionString = JSON.stringify(this.contactsObject.contactsCollection),
        tagsString = JSON.stringify(this.tagCollection);

    localStorage.setItem('lastId', this.contactsObject.lastId);
    localStorage.setItem('collectedContacts', collecionString);
    localStorage.setItem('collectedTags', tagsString);
  },
  renderStoredData: function() {
    var lastId = localStorage.getItem('lastId'),
        collection = JSON.parse(localStorage.getItem('collectedContacts')),
        tagCollection = JSON.parse(localStorage.getItem('collectedTags'));

    if (lastId) {
      this.contactsObject.lastId = lastId;
      this.contactsObject.contactsCollection = collection;

      this.contactsObject.contactsCollection.forEach(function(contact) {
        this.displayContact(contact);
      }.bind(this));

      if (tagCollection) {
        this.tagCollection = tagCollection;
        this.renderTags();
      }
    }
  },
}

$(function() {
  new Manager;
});