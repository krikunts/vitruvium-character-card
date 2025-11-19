<template>
  <div>
    <div class="form-section">
      <div class="form-group"><label for="char-full-name">Имя</label><input type="text" id="char-full-name" v-model="mainInfo.name"></div>
    </div>
    <div class="form-section">
      <h3>Характеристики</h3>
      <div id="attributes-validation-error" class="error-message hidden"></div>
      <div class="form-grid">
        <div class="form-group">
          <label>Телосложение</label>
          <select id="attr-constitution" class="attribute-select" v-model.number="mainInfo.attributes.constitution">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>
        <div class="form-group">
          <label>Внимание</label>
          <select id="attr-attention" class="attribute-select" v-model.number="mainInfo.attributes.attention">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>
        <div class="form-group">
          <label>Движение</label>
          <select id="attr-movement" class="attribute-select" v-model.number="mainInfo.attributes.movement">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>
        <div class="form-group">
          <label>Мышление</label>
          <select id="attr-mind" class="attribute-select" v-model.number="mainInfo.attributes.mind">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>
        <div class="form-group">
          <label>Общение</label>
          <select id="attr-social" class="attribute-select" v-model.number="mainInfo.attributes.social">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>
        <div class="form-group">
          <label>Воля</label>
          <select id="attr-will" class="attribute-select" v-model.number="mainInfo.attributes.will">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '../../stores/character';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';

const characterStore = useCharacterStore();
const { mainInfo } = storeToRefs(characterStore);

// Initialize mainInfo if it's empty


watch(mainInfo, (newVal) => {
  characterStore.setMainInfo(newVal);
}, { deep: true });
</script>

<style scoped>
/* Component-specific styles will go here */
</style>
