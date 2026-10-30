<script setup>
defineProps({
  num: { type: String, default: '' },
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
  tag: { type: String, default: '' },
})
</script>

<template>
  <section class="ed-section">
    <header class="ed-section__head">
      <span v-if="num" class="ed-section__num ed-num">{{ num }}</span>
      <h2 v-if="title" class="ed-section__title">{{ title }}</h2>
      <p v-if="desc" class="ed-section__desc">{{ desc }}</p>
      <span v-if="tag" class="ed-section__tag ed-tag">{{ tag }}</span>
    </header>
    <hr class="ed-rule ed-rule--strong" />
    <div class="ed-section__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.ed-section { display: block; }

.ed-section__head {
  position: relative;
  padding-bottom: var(--ed-space-4);
}

.ed-section__num {
  display: block;
  margin-bottom: var(--ed-space-3);
  font-size: var(--ed-title);
  color: var(--ed-accent);
  letter-spacing: .04em;
}

.ed-section__title {
  font-family: var(--ed-serif);
  font-size: var(--ed-title);
  font-weight: 700;
  line-height: 1.25;
  color: var(--ed-ink);
}

.ed-section__desc {
  margin-top: var(--ed-space-2);
  max-width: 56ch;
  font-size: var(--ed-body);
  color: var(--ed-ink-soft);
}

.ed-section__tag {
  position: absolute;
  top: var(--ed-space-2);
  right: 0;
  padding: var(--ed-space-2) 0;
}

.ed-section__body { padding-top: var(--ed-space-5); }
</style>
