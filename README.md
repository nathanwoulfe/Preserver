[![Build status](https://ci.appveyor.com/api/projects/status/5d665tl2a8x082be?svg=true)](https://ci.appveyor.com/project/nathanwoulfe/preserver)
[![NuGet release](https://img.shields.io/nuget/dt/Preserver.Umbraco.svg)](https://www.nuget.org/packages/Preserver.Umbraco)

# Preserver

Have you ever been hours deep in editing an Umbraco content item, only to have the cat chew through the PC power cable, sending all your work (and the cat) off into the great beyond?

It happens to the best of us.

While Preserver can't bring your cat back (and if Pet Sematary has taught us anything, necromancy isn't a wise option), it can restore your lost content. In fact, your content isn't lost at all, it's tucked away safely in your browser's local storage, waiting to be revived.

## Installation

Grab either the nuget package - `InstallPackage Preserver.Umbraco` - or the Umbraco zip from the releases tab or the Umbraco package repository. Easy!

## Setup

Preserver is a property editor. Given that, you'll need to create a new data type using the Preserver editor and add it to any document types where you want to enable content resuscitation. Doesn't matter which group, chuck it wherever - Preserver will hide itself in the editing view so you won't even realise it's in the background being awesome.

That's it. Done. When you're editing, Preserver will monitor the editor state, keeping a snapshot in local storage incase kitty gets chewy, or Windows decides to get all BSOD on you.

When the worst happens, and you crawl back to the content item to redo your glorious changes, Preserver will prompt to restore the lost data. Click ok, data comes back, cat is sill electrocuted (v2 feature => pet resurrection).