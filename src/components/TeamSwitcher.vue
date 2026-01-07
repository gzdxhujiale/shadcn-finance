<script setup>
import { ref, reactive, computed } from 'vue'
import { 
  ChevronsUpDown, 
  Plus, 
  GalleryVerticalEnd, 
  AudioWaveform, 
  Command,
  Settings2,
  Building2,
  Users,
  Briefcase
} from "lucide-vue-next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import { useTeam } from '@/composables/useTeam'

const { isMobile } = useSidebar()
const { activeTeam, setActiveTeam, addTeam, teams, allNavItems, allProjects } = useTeam()

// 对话框状态
const dialogOpen = ref(false)

// 可选的图标列表
const availableLogos = [
  { name: 'Gallery', icon: GalleryVerticalEnd },
  { name: 'Wave', icon: AudioWaveform },
  { name: 'Command', icon: Command },
  { name: 'Settings', icon: Settings2 },
  { name: 'Building', icon: Building2 },
  { name: 'Users', icon: Users },
  { name: 'Briefcase', icon: Briefcase },
]

// 新团队表单
const newTeam = reactive({
  name: '',
  plan: '',
  logoIndex: 0,
  navMain: [],
  navItems: {},
  projects: []
})

// 重置表单
const resetForm = () => {
  newTeam.name = ''
  newTeam.plan = ''
  newTeam.logoIndex = 0
  newTeam.navMain = []
  newTeam.navItems = {}
  newTeam.projects = []
}

// 切换导航权限（点击一级导航时，全选/取消全选所有子项）
const toggleNavMain = (navId) => {
  const nav = allNavItems.value.find(n => n.id === navId)
  const index = newTeam.navMain.indexOf(navId)
  
  if (index > -1) {
    // 已选中，取消选中并清除所有子项
    newTeam.navMain.splice(index, 1)
    delete newTeam.navItems[navId]
  } else {
    // 未选中，选中并全选所有子项
    newTeam.navMain.push(navId)
    if (nav && nav.items?.length) {
      newTeam.navItems[navId] = nav.items.map(item => item.id)
    }
  }
}

// 切换子项权限
const toggleNavItem = (navId, itemId) => {
  if (!newTeam.navItems[navId]) {
    newTeam.navItems[navId] = []
  }
  const index = newTeam.navItems[navId].indexOf(itemId)
  if (index > -1) {
    newTeam.navItems[navId].splice(index, 1)
    if (newTeam.navItems[navId].length === 0) {
      delete newTeam.navItems[navId]
    }
  } else {
    newTeam.navItems[navId].push(itemId)
  }
}

// 切换项目权限
const toggleProject = (projectId) => {
  const index = newTeam.projects.indexOf(projectId)
  if (index > -1) {
    newTeam.projects.splice(index, 1)
  } else {
    newTeam.projects.push(projectId)
  }
}

// 检查是否选中所有子项
const isAllItemsSelected = (nav) => {
  if (!newTeam.navItems[nav.id]) return false
  return nav.items.every(item => newTeam.navItems[nav.id].includes(item.id))
}

// 检查是否选中某个子项
const isItemSelected = (navId, itemId) => {
  return newTeam.navItems[navId]?.includes(itemId) ?? false
}

// 全选/取消全选子项
const toggleAllItems = (nav) => {
  if (isAllItemsSelected(nav)) {
    delete newTeam.navItems[nav.id]
  } else {
    newTeam.navItems[nav.id] = nav.items.map(item => item.id)
  }
}

// 保存新团队
const handleSave = () => {
  if (!newTeam.name.trim()) return
  
  // 构建权限对象
  const permissions = {
    navMain: newTeam.navMain.length > 0 ? [...newTeam.navMain] : 'all',
    projects: newTeam.projects.length > 0 ? [...newTeam.projects] : 'all'
  }
  
  // 如果有子项配置，添加 navItems
  if (Object.keys(newTeam.navItems).length > 0) {
    permissions.navItems = { ...newTeam.navItems }
  }
  
  // 创建新团队
  const team = {
    name: newTeam.name.trim(),
    logo: availableLogos[newTeam.logoIndex].icon,
    plan: newTeam.plan.trim() || '自定义角色',
    permissions
  }
  
  addTeam(team)
  dialogOpen.value = false
  resetForm()
}

// 打开对话框
const openDialog = () => {
  resetForm()
  dialogOpen.value = true
}
</script>

<template>
  <div>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <component :is="activeTeam.logo" class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">
                {{ activeTeam.name }}
              </span>
              <span class="truncate text-xs">{{ activeTeam.plan }}</span>
            </div>
            <ChevronsUpDown class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
          :side-offset="4"
        >
          <DropdownMenuLabel class="text-xs text-muted-foreground">
            切换团队
          </DropdownMenuLabel>
          <DropdownMenuItem
            v-for="(team, index) in teams"
            :key="team.name"
            class="gap-2 p-2"
            :class="{ 'bg-accent': activeTeam.name === team.name }"
            @click="setActiveTeam(team)"
          >
            <div class="flex size-6 items-center justify-center rounded-sm border">
              <component :is="team.logo" class="size-3.5 shrink-0" />
            </div>
            {{ team.name }}
            <DropdownMenuShortcut>⌘{{ index + 1 }}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="gap-2 p-2" @click="openDialog">
            <div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
              <Plus class="size-4" />
            </div>
            <div class="font-medium text-muted-foreground">
              添加团队
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>

  <!-- 添加团队对话框 -->
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-2xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>创建新团队</DialogTitle>
        <DialogDescription>
          配置团队基本信息和导航权限
        </DialogDescription>
      </DialogHeader>
      
      <div class="flex-1 overflow-auto py-4 space-y-6">
        <!-- 基本信息 -->
        <div class="space-y-4">
          <h4 class="font-medium text-sm border-l-2 border-primary pl-3">基本信息</h4>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>团队名称 *</Label>
              <Input v-model="newTeam.name" placeholder="输入团队名称" />
            </div>
            <div class="space-y-2">
              <Label>角色描述</Label>
              <Input v-model="newTeam.plan" placeholder="如：数据分析师" />
            </div>
          </div>
          
          <!-- 图标选择 -->
          <div class="space-y-2">
            <Label>选择图标</Label>
            <div class="flex gap-2">
              <button
                v-for="(logo, index) in availableLogos"
                :key="logo.name"
                class="w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all"
                :class="newTeam.logoIndex === index 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted hover:border-primary/50'"
                @click="newTeam.logoIndex = index"
              >
                <component :is="logo.icon" class="size-5" />
              </button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <!-- 导航权限配置 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="font-medium text-sm border-l-2 border-primary pl-3">导航权限</h4>
            <span class="text-xs text-muted-foreground">不选择任何项目则显示全部</span>
          </div>
          
          <div class="space-y-3">
            <div 
              v-for="nav in allNavItems" 
              :key="nav.id"
              class="border rounded-lg p-3"
            >
              <!-- 一级导航 -->
              <div class="flex items-center gap-3">
                <div 
                  class="flex items-center gap-2 cursor-pointer flex-1"
                  @click="toggleNavMain(nav.id)"
                >
                  <Checkbox 
                    :checked="newTeam.navMain.includes(nav.id)"
                  />
                  <component :is="nav.icon" class="size-4 text-muted-foreground" />
                  <span class="font-medium text-sm">{{ nav.title }}</span>
                  <span v-if="newTeam.navItems[nav.id]?.length" class="text-xs text-muted-foreground">
                    ({{ newTeam.navItems[nav.id]?.length || 0 }}/{{ nav.items?.length || 0 }})
                  </span>
                </div>
              </div>
              
              <!-- 子项列表 - 始终展开 -->
              <div 
                v-if="nav.items?.length"
                class="mt-3 ml-6 flex flex-wrap gap-2"
              >
                <div
                  v-for="item in nav.items"
                  :key="item.id"
                  class="flex items-center gap-1.5 px-2.5 py-1 rounded border text-sm cursor-pointer transition-colors"
                  :class="isItemSelected(nav.id, item.id) 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'border-muted hover:border-primary/50'"
                  @click="toggleNavItem(nav.id, item.id)"
                >
                  <Checkbox 
                    :checked="isItemSelected(nav.id, item.id)"
                    class="h-3.5 w-3.5"
                  />
                  {{ item.title }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <!-- 文档权限配置 -->
        <div class="space-y-4">
          <h4 class="font-medium text-sm border-l-2 border-primary pl-3">文档权限</h4>
          
          <div class="flex flex-wrap gap-2">
            <div
              v-for="project in allProjects"
              :key="project.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors"
              :class="newTeam.projects.includes(project.id) 
                ? 'bg-primary/10 border-primary' 
                : 'border-muted hover:border-primary/50'"
              @click="toggleProject(project.id)"
            >
              <Checkbox 
                :checked="newTeam.projects.includes(project.id)"
              />
              <component :is="project.icon" class="size-4" />
              <span class="text-sm">{{ project.name }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="dialogOpen = false">取消</Button>
        <Button :disabled="!newTeam.name.trim()" @click="handleSave">创建团队</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  </div>
</template>
