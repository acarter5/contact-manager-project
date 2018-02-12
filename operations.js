$(function() {

/* DOM Elements*/

  var $contactsContainer = $('#contacts-container'),
      $contactForm = $('.form'),
      $noContacts = $('.no-contacts'),
      $well = $('.well'),
      $contactBtn = $('.add-contact'),
      $submitBtn = $('.submit-button'),
      $cancelBtn = $('#cancel'),
      $tagBtn = $('.add-tag'),
      $tagInput = $('.tag-input'),
      $searchInput = $('.contact-name-search');

/* Handlebars */

  var tagTemplate = $('#tags').html(),
      tagScript = Handlebars.compile(tagTemplate),
      tagsToRenderTemplate = $('#tagsToRender').html();

  Handlebars.registerPartial('tagsPartial', tagsToRenderTemplate);

  var contactContent = $('#contactContent').html();
  var partialContactScript = Handlebars.compile(contactContent);

  Handlebars.registerPartial('contactContentPartial', contactContent);

  var contactTemplate = $('#contact').html(),
      contactScript = Handlebars.compile(contactTemplate);


  function isEmpty( el ){
      return !$.trim(el.html())
  }

/* Constructor */

  function Contact() {

    this.lastId = 0;
    this.collection = [];
    this.tagCollection = [];
    this.init();
  }

/* Constructor Prototype */

  Contact.prototype = {
    makeContact: function() {
      var contact = {
        id: this.lastId,
        name: '',
        email: '',
        phone: '',
        tags: [],
      };

      this.lastId++;
      this.collection.push(contact);
      return contact;
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
    contactRendered: function(contact) {
      var isRendered = false;
      var $renderedContacts = $contactsContainer.find('input[type=hidden]');
      $renderedContacts.each(function() {
        if(Number($(this).val()) === +contact.id) {
          isRendered = true;
        }
      });
      return isRendered;
    },
    removeFromCollection: function(id) {
      var idx;

      this.collection.forEach(function(obj, index) {
        if (obj.id === id) {
          idx = index;
          return;
        }
      });

      this.collection.splice(idx, 1);
    },
    displayContact: function(contact) {
      var contactHTML = contactScript(contact);

      if (this.contactRendered(contact)) {
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
    editContact: function(event) {
      event.preventDefault();
      var id = Number(this.findId(event));

      this.curContact = this.collection.filter(function(obj) {
         return obj.id === id;
      }).pop();

      this.showForm();
    },
    cancelContact(event) {
      event.preventDefault();

      if(!(this.contactRendered(this.curContact))) {
        this.removeFromCollection(this.curContact.id);
      }

      this.formDone();
    },
    deleteContact: function(event) {
      event.preventDefault();
      var id = Number(this.findId(event)),
          $parent = this.findRenderedContact(id),
          idx;

      this.removeFromCollection(id);

      $parent.remove();

      if (isEmpty($('#contacts-container'))) {
        $('.no-contacts').show();
      }
    },
    renderTags: function() {
      var tagsObjectArray = this.tagCollection.map(function(newTag) {
        console.log(this);
        return {tag: newTag};
      }.bind(this));

      $('.tags dd').html('');
      $('.tags dd').append(tagScript({tags: tagsObjectArray}));
    },
    newTag: function(event) {
      event.preventDefault();
      console.log(this);
      console.log(this.tagCollection);
      var tagsArray = this.tagCollection;

      if($tagInput.val() !== '') {
        tagsArray.push($tagInput.val());
        $tagInput.val('');
      }


      this.renderTags();
    },
    processContact: function(event) {
      event.preventDefault()
      var contact = this.makeContact();
      this.curContact = contact;
      this.showForm();
    },
    filterContacts: function(event) {
      var query = new RegExp($searchInput.val()),
          $controlTags = $('.tags-control input[type=checkbox]:checked'),
          $renderedContacts = $contactsContainer.find('.contact');
          controlTagsArray = [],
          searchFilteredArray = [],
          returnContacts = [];

      $controlTags.each(function() {
        controlTagsArray.push($(this).val());
      });

      this.collection.forEach(function(contact) {
        if (contact.name.match(query)) {
          searchFilteredArray.push(contact);
        }
      });

      controlTagsArray.forEach(function(controlTag) {
        searchFilteredArray.forEach(function(contact, index) {
          if ($.inArray(controlTag, contact.tags) === -1) {
            searchFilteredArray.splice(index, 1);
          }
        });
      });

      $renderedContacts.hide();

      searchFilteredArray.forEach(function(contact) {
        $renderedContacts.each(function() {
          var $curRenderedContact = $(this);

          if (contact.id === Number($curRenderedContact.find('input[type=hidden]').val())) {
            $curRenderedContact.show();
          }

        });
      }.bind(this));
    },
    storeData: function(event) {
      var collecionString = JSON.stringify(this.collection),
          tagsString = JSON.stringify(this.tagCollection);

      localStorage.setItem('lastId', this.lastId);
      localStorage.setItem('collectedContacts', collecionString);
      localStorage.setItem('collectedTags', tagsString);

    },
    renderStoredData: function() {
      var lastId = localStorage.getItem('lastId'),
          collection = JSON.parse(localStorage.getItem('collectedContacts')),
          tagCollection = JSON.parse(localStorage.getItem('collectedTags'));

      if (lastId) {
        this.lastId = lastId;
        this.collection = collection;

        this.collection.forEach(function(contact) {
          this.displayContact(contact);
        }.bind(this));

        if (tagCollection) {
          this.tagCollection = tagCollection;
          this.renderTags();
        }
      }
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
      this.bindEvents();
      this.renderStoredData();

       if (isEmpty($('#contacts-container'))) {
        $('.no-contacts').show();
      }

    },
  }

 new Contact();
});