/*
 * Copyright 1996 by Michel D. Grimminck
 *
 * All Rights Reserved
 *
 * Permission to use, copy, modify, and distribute this software and its
 * documentation for any purpose and without fee is hereby granted,
 * provided that the above copyright notice appear in all copies and that
 * both that copyright notice and this permission notice appear in
 * supporting documentation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

#include <stdio.h>
#include "var.h"
#include "const.h"
#include "functions.h"
#include <string.h>
#include <time.h>
#include <unistd.h>
#include <stdarg.h>

void setPlayers(int mycolor)
{
    if (mycolor==white) {
        strcpy(pdn_info.whitepl,"Dragon");
        strcpy(pdn_info.blackpl,"Human");
    }
    else if (mycolor==black) {
        strcpy(pdn_info.whitepl,"Human");
        strcpy(pdn_info.blackpl,"Dragon");
    }
    else {
        strcpy(pdn_info.whitepl,"NotSet");
        strcpy(pdn_info.blackpl,"NotSet");
    }
}

void write_pdn2(FILE *out,int mode)
// writes pdn game to open file
// mode=1 for html mode
{
    int i,found,p,col;
    struct tm *date;
    time_t t;
    char host_name[100];
    t=time((time_t *)NULL);
    date=gmtime(&t);
    BTYPE local[93];
    int gg;
    char nl[16];
    gg=game_color^(game_history_nr&1);
    decompress_board(local,game_history[0].board);
    if (game_history_max==0) {
        copy_board(local,board);            
    }
    
    sprintf(nl,"\n");
    if (mode==1) sprintf(nl,"<br>\n");
    
#ifdef NO_GETHOSTNAME
    strcpy(host_name,"localhost");
#else
    if (gethostname(host_name, 100)!=0) strcpy(host_name,"localhost");
#endif

    if ((pieces[white|man]+pieces[white|crown])==0) {
        sprintf(pdn_info.result,"0-1");
    }
    if ((pieces[black|man]+pieces[black|crown])==0) {
        sprintf(pdn_info.result,"1-0");
    }
    if (theoretic(game_color)==DRAW) {
        sprintf(pdn_info.result,"1/2-1/2");
    }
    fprintf(out,"[Event \"%s\"]%s",pdn_info.event,nl);
    if (pdn_info.date[0]==0) {
        fprintf(out,"[Date \"%.4i.%.2i.%.2i\"]%s",(int)date->tm_year+1900,(int)date->tm_mon+1,date->tm_mday,nl);
    } else {    
        fprintf(out,"[Date \"%s\"]%s",pdn_info.date,nl);
    }
    fprintf(out,"[Site \"%s\"]%s",pdn_info.site,nl);
    fprintf(out,"[White \"%s\"]%s",pdn_info.whitepl,nl);
    fprintf(out,"[Black \"%s\"]%s",pdn_info.blackpl,nl);
    fprintf(out,"[Result \"%s\"]%s",pdn_info.result,nl);
    fprintf(out,"[Round \"%s\"]%s",pdn_info.round,nl);
    fprintf(out,"[GameType \"20\"]%s",nl);
    if (isStartingPosition(local)==false) {
        writeFen(out,local,gg,mode);
    }
    fprintf(out,"%s",nl);
    for(i=0;i<game_history_max;i++) {
        if (i%2==0) fprintf(out,"%i. ",i/2+1);
        fprint_move_pdn(out,game_history[i].move);
        if (game_history[i].comment[0]!=0) {
            if (mode==0) fprintf(out," {%s}",game_history[i].comment);
            if (mode==1) fprintf(out," <font color=#808080>{%s}</font>",game_history[i].comment);
        }
        if (i%8==7 && mode==0) fprintf(out,"\n"); else fprintf(out," ");

    }
    fprintf(out,"%s%s",pdn_info.result,nl);
}

void write_pdn(char *file)
{
    FILE *out;
    out=fopen(file,"w");
    if (out==NULL) {
        dprint("pdn_write: not possible to save '%s'\n",file);
        return;
    }
    write_pdn2(out,0);
    fclose(out);
    /* inform windows interface that game was saved */
    winprint("\n");
    winprint("SAVEPDN\n");
}
